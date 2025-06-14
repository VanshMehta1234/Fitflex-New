import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMembership } from '../context/MembershipContext';
import { toast } from 'sonner';
import { membershipService } from '../lib/membershipService';
import { supabase } from '../supabase';
import { MembershipTier } from '../types/membership';

export default function MembershipSuccess() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const { user, refreshUserProfile } = useAuth();
  const { refreshMembership } = useMembership();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const updateMembership = async () => {
      try {
        // 1. Get the new membership type from URL parameters
        const newType = searchParams.get('tier') as MembershipTier;
        const sessionId = searchParams.get('session_id');
        
        if (!newType || !sessionId || !user) {
          throw new Error("Missing required parameters or user not authenticated");
        }
        
        console.log(`Processing membership upgrade to ${newType} with session ID: ${sessionId}`);
        
        // 2. Get current membership record
        const currentMembership = await membershipService.getCurrentMembership(user.id);
          
        // 3. If there's an existing membership, delete it
        if (currentMembership) {
          console.log(`Found existing membership (ID: ${currentMembership.id}, Type: ${currentMembership.type})`);
          
          // First, create a history record of the cancellation
          await membershipService.updateMembership(
            currentMembership.id,
            { status: 'cancelled' },
            'cancelled',
            `Membership cancelled due to upgrade to ${newType}`
          );
          
          // Then delete the membership record
          const { error: deleteError } = await supabase
            .from('memberships')
            .delete()
            .eq('id', currentMembership.id);
            
          if (deleteError) {
            console.error("Error deleting old membership:", deleteError);
            throw new Error(`Failed to delete old membership: ${deleteError.message}`);
          }
          
          console.log("Old membership deleted successfully");
        }
        
        // 4. Create new membership record with Stripe information
        // In a real implementation, you'd verify the session with Stripe first
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // 30-day membership by default
        
        // Create the new membership
        const { data: newMembership, error: createError } = await supabase
          .from('memberships')
          .insert([{
            user_id: user.id,
            type: newType,
            status: 'active',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            auto_renew: true,
            // In a real implementation, you'd get these from Stripe
            stripe_subscription_id: `sub_${Math.random().toString(36).substr(2, 9)}`,
            stripe_customer_id: `cus_${Math.random().toString(36).substr(2, 9)}`,
          }])
          .select()
          .single();
          
        if (createError) {
          throw new Error(`Failed to create new membership: ${createError.message}`);
        }
        
        console.log("New membership created successfully:", newMembership);
        
        // 5. Update user profile with new membership type
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ membership_type: newType })
          .eq('id', user.id);
          
        if (profileError) {
          throw new Error(`Failed to update user profile: ${profileError.message}`);
        }
        
        console.log("User profile updated with new membership type");
        
        // 6. Create history record for the upgrade
        await supabase
          .from('membership_history')
          .insert([{
            membership_id: newMembership.id,
            user_id: user.id,
            action: 'upgraded',
            details: `Membership upgraded to ${newType}`,
            timestamp: new Date().toISOString()
          }]);
        
        console.log("Membership history record created");
        
        // 7. Refresh user profile and membership data in context
        await Promise.all([refreshUserProfile(), refreshMembership()]);
        
        // Success! Show message and redirect
        setIsProcessing(false);
        toast.success(`Your membership has been upgraded to ${newType}!`);
        setTimeout(() => navigate('/profile'), 3000);
      } catch (err: any) {
        console.error("Error updating membership:", err);
        setError(err.message);
        setIsProcessing(false);
        toast.error(`Failed to process membership upgrade: ${err.message}`);
      }
    };
    
    updateMembership();
  }, [location, user, refreshUserProfile, navigate, searchParams, refreshMembership]);
  
  // Render success/processing UI
  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-16">
        {isProcessing ? (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Processing Your Membership Upgrade</CardTitle>
              <CardDescription>Please wait while we update your membership...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-destructive">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate('/membership')}>
                Try Again
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Membership Upgraded Successfully!</CardTitle>
              <CardDescription>Your account has been updated. Redirecting to your profile...</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-4">
              <p className="text-muted-foreground">
                Thank you for upgrading your membership. You now have access to all the features included in your new membership plan.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button className="w-full" onClick={() => navigate('/profile')}>
                View My Membership <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/home')}>
                Go to Dashboard
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </MainLayout>
  );
} 