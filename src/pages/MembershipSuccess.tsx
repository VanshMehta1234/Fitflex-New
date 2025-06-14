import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { refreshMembership } = useMembership();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionId = searchParams.get('session_id');
  const tier = searchParams.get('tier') as MembershipTier || 'basic';

  useEffect(() => {
    async function processCheckoutSuccess() {
      if (!sessionId) {
        setError('No session ID found');
        setIsLoading(false);
        return;
      }

      if (!user) {
        setError('User not logged in');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Processing successful checkout with session ID:', sessionId);
        
        // Create a mock subscription ID based on the session ID
        const mockSubscriptionId = `sub_${sessionId.substring(8)}`;
        const mockCustomerId = `cus_${user.id.substring(0, 8)}`;
        
        // Calculate subscription dates (1 month from now for monthly, 1 year for yearly)
        const startDate = new Date().toISOString();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // Default to monthly
        
        // Create membership record in Supabase
        await membershipService.createMembership(
          user.id,
          tier,
          mockSubscriptionId,
          mockCustomerId,
          startDate,
          endDate.toISOString(),
          true
        );
        
        // Add a payment record
        const plan = await membershipService.getPlan(tier);
        if (plan) {
          const membership = await membershipService.getCurrentMembership(user.id);
          if (membership) {
            await membershipService.addPaymentRecord(
              user.id,
              membership.id,
              `pi_${sessionId.substring(10)}`,
              `in_${sessionId.substring(12)}`,
              plan.monthlyPrice,
              'usd',
              'succeeded',
              startDate,
              endDate.toISOString()
            );
          }
        }
        
        // Refresh membership data
        await refreshMembership();
        
        // Show success message
        toast.success('Membership activated successfully!');
        setIsLoading(false);
      } catch (err) {
        console.error('Error processing checkout:', err);
        setError('Failed to process your subscription. Please contact support.');
        setIsLoading(false);
      }
    }

    processCheckoutSuccess();
  }, [sessionId, user, refreshMembership, tier]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-md mx-auto py-16">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Processing Your Subscription</CardTitle>
              <CardDescription>Please wait while we set up your membership...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container max-w-md mx-auto py-16">
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
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-16">
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Subscription Successful!</CardTitle>
            <CardDescription>Your membership has been activated successfully.</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-4">
            <p className="text-muted-foreground">
              Thank you for subscribing to FitFlex. You now have access to all the features included in your membership plan.
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
      </div>
    </MainLayout>
  );
} 