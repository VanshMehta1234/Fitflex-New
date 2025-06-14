import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserMembership, PaymentHistory, MembershipTier } from '../types/membership';
import { membershipService } from '../lib/membershipService';
import { stripeService } from '../lib/stripeService';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';

interface MembershipContextType {
  membership: UserMembership | null;
  membershipHistory: any[] | null;
  paymentHistory: PaymentHistory[];
  isLoading: boolean;
  error: string | null;
  refreshMembership: () => Promise<void>;
  upgradeMembership: (tier: MembershipTier, billingCycle: 'monthly' | 'yearly') => Promise<void>;
  cancelMembership: () => Promise<void>;
  pauseMembership: () => Promise<void>;
  resumeMembership: () => Promise<void>;
  getInvoice: (invoiceId: string) => Promise<any>;
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

export const MembershipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [membershipHistory, setMembershipHistory] = useState<any[] | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [pendingUpgrade, setPendingUpgrade] = useState<{tier: MembershipTier, billingCycle: 'monthly' | 'yearly'} | null>(null);

  // Fetch membership data when user changes
  useEffect(() => {
    if (user) {
      refreshMembership();
    } else {
      setMembership(null);
      setMembershipHistory(null);
      setPaymentHistory([]);
      setIsLoading(false);
    }
  }, [user]);

  // Refresh membership data
  const refreshMembership = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current membership
      const currentMembership = await membershipService.getCurrentMembership(user.id);
      setMembership(currentMembership);
      
      // If membership exists, get history
      if (currentMembership) {
        const history = await membershipService.getMembershipHistory(currentMembership.id);
        setMembershipHistory(history);
        
        // Get payment history
        const payments = await membershipService.getPaymentHistory(user.id);
        setPaymentHistory(payments);
      }
    } catch (err) {
      console.error('Error refreshing membership data:', err);
      setError('Failed to load membership data');
      toast.error('Failed to load membership data');
    } finally {
      setIsLoading(false);
    }
  };

  // Upgrade membership
  const upgradeMembership = async (tier: MembershipTier, billingCycle: 'monthly' | 'yearly') => {
    if (!user) {
      toast.error('You must be logged in to upgrade your membership');
      return;
    }
    
    console.log(tier);
    console.log(billingCycle);

    // Check if user already has a membership
    if (membership && membership.type !== tier) {
      // Show confirmation dialog
      setPendingUpgrade({ tier, billingCycle });
      setShowConfirmDialog(true);
      return;
    }
    
    // If no existing membership or same tier, proceed without confirmation
    await processMembershipUpgrade(tier, billingCycle);
  };
  
  // Process the actual membership upgrade after confirmation
  const processMembershipUpgrade = async (tier: MembershipTier, billingCycle: 'monthly' | 'yearly') => {
    try {
      if (!user) {
        toast.error('You must be logged in to upgrade your membership');
        return;
      }
      
      if (membership && membership.stripeSubscriptionId) {
        // Update existing subscription
        await stripeService.updateSubscription(
          membership.stripeSubscriptionId,
          tier,
          billingCycle
        );
        toast.success('Your membership has been updated');
      } else {
        // Create new subscription
        await stripeService.createCheckoutSession(
          user.id,
          tier,
          billingCycle
        );
        // Note: The user will be redirected to Stripe Checkout
      }
    } catch (err) {
      console.error('Error upgrading membership:', err);
      toast.error('Failed to process membership upgrade');
    } finally {
      // Reset confirmation state
      setShowConfirmDialog(false);
      setPendingUpgrade(null);
    }
  };

  // Cancel membership
  const cancelMembership = async () => {
    if (!membership || !membership.stripeSubscriptionId) {
      toast.error('No active membership to cancel');
      return;
    }
    
    try {
      await stripeService.cancelSubscription(membership.stripeSubscriptionId);
      
      // Update local state
      await membershipService.updateMembership(
        membership.id,
        { status: 'cancelled', autoRenew: false },
        'cancelled',
        'Membership cancelled by user'
      );
      
      toast.success('Your membership has been canceled');
      refreshMembership();
    } catch (err) {
      console.error('Error canceling membership:', err);
      toast.error('Failed to cancel membership');
    }
  };

  // Pause membership
  const pauseMembership = async () => {
    if (!membership || !membership.stripeSubscriptionId) {
      toast.error('No active membership to pause');
      return;
    }
    
    try {
      await stripeService.pauseSubscription(membership.stripeSubscriptionId);
      
      // Update local state
      await membershipService.updateMembership(
        membership.id,
        { status: 'paused' },
        'paused',
        'Membership paused by user'
      );
      
      toast.success('Your membership has been paused');
      refreshMembership();
    } catch (err) {
      console.error('Error pausing membership:', err);
      toast.error('Failed to pause membership');
    }
  };

  // Resume membership
  const resumeMembership = async () => {
    if (!membership || !membership.stripeSubscriptionId || membership.status !== 'paused') {
      toast.error('No paused membership to resume');
      return;
    }
    
    try {
      await stripeService.resumeSubscription(membership.stripeSubscriptionId);
      
      // Update local state
      await membershipService.updateMembership(
        membership.id,
        { status: 'active' },
        'resumed',
        'Membership resumed by user'
      );
      
      toast.success('Your membership has been resumed');
      refreshMembership();
    } catch (err) {
      console.error('Error resuming membership:', err);
      toast.error('Failed to resume membership');
    }
  };

  // Get invoice details
  const getInvoice = async (invoiceId: string) => {
    try {
      return await stripeService.getInvoice(invoiceId);
    } catch (err) {
      console.error('Error getting invoice:', err);
      toast.error('Failed to retrieve invoice');
      throw err;
    }
  };

  const value = {
    membership,
    membershipHistory,
    paymentHistory,
    isLoading,
    error,
    refreshMembership,
    upgradeMembership,
    cancelMembership,
    pauseMembership,
    resumeMembership,
    getInvoice,
  };

  return (
    <MembershipContext.Provider value={value}>
      {children}
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Membership Plan</DialogTitle>
            <DialogDescription>
              Your current membership plan will be canceled, and any remaining days will be lost. 
              Are you sure you want to proceed with this change?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowConfirmDialog(false);
              setPendingUpgrade(null);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (pendingUpgrade) {
                processMembershipUpgrade(pendingUpgrade.tier, pendingUpgrade.billingCycle);
              }
            }}>
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MembershipContext.Provider>
  );
};

export const useMembership = () => {
  const context = useContext(MembershipContext);
  if (context === undefined) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
}; 