import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { CheckCircle, CreditCard, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { membershipService, MEMBERSHIP_PLANS } from '../lib/membershipService';
import { useMembership } from '../context/MembershipContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { MembershipPlan, MembershipTier } from '../types/membership';
import { Label } from '../components/ui/label';

export default function MembershipPlans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { membership, isLoading: membershipLoading, upgradeMembership } = useMembership();
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<MembershipPlan[]>(MEMBERSHIP_PLANS); // Default to mock data
  const [isLoading, setIsLoading] = useState(true);

  // Fetch membership plans
  useEffect(() => {
    async function fetchPlans() {
      setIsLoading(true);
      try {
        const availablePlans = await membershipService.getPlans();
        console.log(availablePlans)
        if (availablePlans && availablePlans.length > 0) {
          setPlans(availablePlans);
        } else {
          console.log('Using mock plans as fallback');
          // If no plans returned from database, use mock data
          setPlans(MEMBERSHIP_PLANS);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('Failed to load membership plans, using default data');
        // Use mock data as fallback
        setPlans(MEMBERSHIP_PLANS);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlans();
  }, []);

  // Calculate savings for yearly billing
  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyCost = monthlyPrice * 12;
    const savings = monthlyCost - yearlyPrice;
    const savingsPercentage = Math.round((savings / monthlyCost) * 100);
    return { savings, savingsPercentage };
  };

  // Handle plan selection
  const handleSelectPlan = async (tier: MembershipTier) => {
    if (!user) {
      toast.error('Please sign in to select a membership plan');
      navigate('/login');
      return;
    }

    try {
      setProcessingPlan(tier);
      await upgradeMembership(tier, yearlyBilling ? 'yearly' : 'monthly');
      toast.success('Plan selection successful! Redirecting to payment...');
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error('Failed to process your request');
    } finally {
      setProcessingPlan(null);
    }
  };

  // Check if user already has this plan
  const isCurrentPlan = (tier: MembershipTier) => {
    return membership?.type === tier && membership?.status === 'active';
  };

  // Render loading state
  if (isLoading || membershipLoading) {
    return (
      <MainLayout>
        <div className="container max-w-6xl mx-auto py-8">
          <div className="flex flex-col justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <span className="text-lg">Loading membership plans...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Membership Plan</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select the membership that fits your fitness goals. All plans include access to our mobile app and community features.
          </p>
          
          <div className="flex items-center justify-center mt-6">
            <div className="flex items-center space-x-2">
              <Label htmlFor="billing-toggle" className={!yearlyBilling ? "font-medium" : "text-muted-foreground"}>
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={yearlyBilling}
                onCheckedChange={setYearlyBilling}
              />
              <Label htmlFor="billing-toggle" className={yearlyBilling ? "font-medium" : "text-muted-foreground"}>
                Yearly
                <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">Save up to 20%</Badge>
              </Label>
            </div>
          </div>
        </div>

        {membership && membership.status === 'active' && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-800" />
            <AlertTitle className="text-blue-800">You have an active membership</AlertTitle>
            <AlertDescription className="text-blue-700">
              You currently have an active {membership.type} membership. You can upgrade your plan at any time.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const { savings, savingsPercentage } = calculateSavings(plan.monthlyPrice, plan.yearlyPrice);
            const price = yearlyBilling ? plan.yearlyPrice : plan.monthlyPrice;
            const isCurrentUserPlan = isCurrentPlan(plan.tier);
            
            // Ensure features is always an array
            const features = Array.isArray(plan.features) 
              ? plan.features 
              : typeof plan.features === 'string' 
                ? [plan.features] 
                : [];
            
            return (
              <Card 
                key={plan.id} 
                className={`flex flex-col ${plan.isPopular ? 'border-primary shadow-lg' : ''}`}
              >
                {plan.isPopular && (
                  <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-4">
                    <div className="text-3xl font-bold">
                      ${price.toFixed(2)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{yearlyBilling ? 'year' : 'month'}
                      </span>
                    </div>
                    {yearlyBilling && (
                      <div className="text-sm text-green-600 mt-1">
                        Save ${savings.toFixed(2)} ({savingsPercentage}%) with annual billing
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 mt-6">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                        <span>{typeof feature === 'string' ? feature : feature.featureName}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={isCurrentUserPlan ? "outline" : (plan.isPopular ? "default" : "outline")}
                    onClick={() => handleSelectPlan(plan.tier)}
                    disabled={isCurrentUserPlan || !!processingPlan}
                  >
                    {processingPlan === plan.tier ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentUserPlan ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Current Plan
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        {membership ? 'Switch to this Plan' : 'Select Plan'}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 bg-muted/50 p-6 rounded-lg">
          <div className="flex items-start gap-4">
            <Shield className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h3 className="text-lg font-medium mb-2">Secure Payments & Easy Cancellation</h3>
              <p className="text-muted-foreground">
                All payments are processed securely through Stripe. You can cancel or pause your membership at any time from your account settings.
                No long-term commitments, no hidden fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
