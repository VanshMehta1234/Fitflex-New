import { useState, useEffect } from "react";
import { MainLayout } from "../components/Layout/MainLayout";
import { PageHeader, PageContainer } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useReferral } from "../context/ReferralContext";
import { useXp } from "../context/XpContext";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";
import { 
  Users, 
  Share2, 
  Copy, 
  CheckCircle, 
  Sparkles, 
  ChevronRight, 
  Gift, 
  Clock, 
  AlertCircle 
} from "lucide-react";
import { supabase } from "../supabase";

export default function Refer() {
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [redeemerProfiles, setRedeemerProfiles] = useState<any[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { user } = useAuth();
  const { 
    activeReferral, 
    referrals, 
    referralRedemptions, 
    isLoading: referralLoading, 
    hasReferral,
    createNewReferral,
    redeemCode: redeemReferralCode,
    refreshReferrals
  } = useReferral();
  
  const { 
    userXp, 
    userLevel, 
    xpTransactions, 
    refreshXpData,
    isLoading: xpLoading
  } = useXp();

  // Refresh data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsRefreshing(true);
      try {
        await Promise.all([
          refreshReferrals(),
          refreshXpData()
        ]);
      } catch (error) {
        console.error("Error refreshing data:", error);
      } finally {
        setIsRefreshing(false);
      }
    };
    
    loadData();
  }, []);

  // Fetch profile information for redeemers
  useEffect(() => {
    const fetchProfiles = async () => {
      const profiles = await getProfiles();
      setRedeemerProfiles(profiles);
    };
    fetchProfiles();
  }, [referralRedemptions]);

  async function getProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

      if (error) {
        console.error('Error fetching profiles:', error);
        return [];
      }
      return data || [];
  }
  // Calculate referral stats
  const completedReferrals = referralRedemptions.filter(r => r.reward_given);
  
  // Get XP earned specifically from referrals
  const referralXp = xpTransactions
    .filter(tx => tx.source === 'referral_bonus' || tx.source === 'referral_redemption')
    .reduce((total, tx) => total + tx.amount, 0);
  
  // If we don't have transactions yet, estimate based on redemptions
  const estimatedReferralXp = completedReferrals.length * 500;
  
  // Use actual XP from transactions if available, otherwise estimated
  const totalReferralXp = referralXp || estimatedReferralXp;

  // Get referral code and link
  const referralCode = activeReferral?.referral_code || "";
  const referralLink = activeReferral 
    ? `https://fitflex.com/join?ref=${activeReferral.referral_code}`
    : "";

  // Handle refreshing data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshReferrals(),
        refreshXpData()
      ]);
      toast.success("Data refreshed");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get redeemer name
  const getRedeemerName = (redeemerId: string): string => {
    const profile = redeemerProfiles.find(p => p.id === redeemerId);
    return profile?.name || 'Anonymous User';
  };

  // Handle copying referral code
  const handleCopyReferralCode = () => {
    const codeToUse = generatedCode || activeReferral?.referral_code;
    if (!codeToUse) {
      toast.error("No referral code available");
      return;
    }
    
    navigator.clipboard.writeText(codeToUse)
      .then(() => {
        setCopied(true);
        toast.success("Referral code copied to clipboard!");
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(err => {
        console.error("Failed to copy: ", err);
        toast.error("Failed to copy. Please try selecting the code manually.");
      });
  };

  // Handle creating a new referral code
  const handleCreateReferral = async () => {
    try {
      const result = await createNewReferral();
      if (result) {
        setGeneratedCode(activeReferral?.referral_code || null);
      }
    } catch (error) {
      console.error("Error creating referral:", error);
      toast.error("Failed to create referral code");
    }
  };

  // Handle redeeming a code
  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) {
      toast.error("Please enter a referral code");
      return;
    }
    
    setIsRedeeming(true);
    
    try {
      const success = await redeemReferralCode(redeemCode.trim());
      if (success) {
        // After successful redemption, refresh XP data to show updates
        await refreshXpData();
        
        toast.success("Referral code redeemed successfully!");
        setRedeemCode("");
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error redeeming code:", error);
      toast.error("Failed to redeem code");
    } finally {
      setIsRedeeming(false);
    }
  };

  const isLoading = referralLoading || xpLoading || isRefreshing;

  return (
    <MainLayout>
      <PageContainer>
        <PageHeader
          title="Refer & Earn"
          description="Share your referral code with friends and earn rewards"
          icon={Share2}
          actions={
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Refreshing...
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="h-4 w-4 mr-2">↻</span>
                  Refresh
                </span>
              )}
            </Button>
          }
        />
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Referral Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Share2 className="h-5 w-5 mr-2" />
                Your Referral Code
              </CardTitle>
              <CardDescription>
                Share your code with friends and earn rewards
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-3/4" />
                </div>
              ) : hasReferral ? (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-md flex items-center justify-between">
                    <code className="text-lg font-mono font-semibold">
                      {referralCode}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleCopyReferralCode}
                      className="ml-2"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={handleCreateReferral}
                      className="flex-1"
                    >
                      Generate New Code
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No referral code yet</AlertTitle>
                    <AlertDescription>
                      Create your first referral code to start earning rewards
                    </AlertDescription>
                  </Alert>
                  
                  <Button onClick={handleCreateReferral} className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Referral Code
                  </Button>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex-col items-start border-t px-6 py-4">
              <h3 className="text-sm font-medium mb-2">How it works:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start">
                  <span className="h-5 w-5 text-center mr-2">1.</span>
                  Share your referral code with friends
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-center mr-2">2.</span>
                  When they join using your code, you both earn 500 XP
                </li>
                <li className="flex items-start">
                  <span className="h-5 w-5 text-center mr-2">3.</span>
                  Use XP to unlock achievements and membership perks
                </li>
              </ul>
            </CardFooter>
          </Card>
          
          {/* Stats & Redeem Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="h-5 w-5 mr-2" />
                Referral Stats
              </CardTitle>
              <CardDescription>
                Track your referrals and redeem codes
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-md text-center">
                  <Users className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{isLoading ? '-' : completedReferrals.length}</p>
                  <p className="text-xs text-muted-foreground">Successful Referrals</p>
                </div>
                
                <div className="bg-muted p-4 rounded-md text-center">
                  <Sparkles className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{isLoading ? '-' : totalReferralXp}</p>
                  <p className="text-xs text-muted-foreground">XP Earned</p>
                </div>
              </div>
              
              <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-md text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary-500" />
                  <span className="font-medium">Your Current XP: {isLoading ? '...' : userXp}</span>
                </div>
                <p className="text-muted-foreground">
                  {isLoading ? 'Loading...' : 
                    `You've earned ${totalReferralXp} XP from referrals. 
                    Every successful referral earns you and your friend 500 XP!`
                  }
                </p>
              </div>
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Redeem a Code
                </Button>
              </div>
            </CardContent>
            
            <div className="border-t px-6 py-3">
              <h3 className="text-sm font-medium mb-2">Recent Referrals</h3>
              
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : referralRedemptions.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {referralRedemptions.slice(0, 5).map(redemption => (
                    <div 
                      key={redemption.id} 
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {getRedeemerName(redemption.redeemer_id)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {redemption.created_at ? 
                              format(parseISO(redemption.created_at), 'MMM d, yyyy') :
                              'Recently'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={redemption.reward_given ? "success" : "outline"}>
                        {redemption.reward_given ? '+500 XP' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  <p className="text-sm">No referrals yet</p>
                  <p className="text-xs mt-1">Share your code to start earning rewards</p>
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* How It Works Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">How Referrals Work</h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mr-2 text-primary-foreground text-xs font-bold">1</div>
                  Share Your Code
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Copy your unique referral code and share it with friends, family, or on social media.
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mr-2 text-primary-foreground text-xs font-bold">2</div>
                  Friends Join Using Your Code
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                When your friends sign up for FitFlex and enter your referral code, both of you earn rewards.
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mr-2 text-primary-foreground text-xs font-bold">3</div>
                  Earn Rewards
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                For each successful referral, you'll earn 500 XP. These points can be used towards special perks and membership discounts.
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
      
      {/* Redeem Code Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redeem Referral Code</DialogTitle>
            <DialogDescription>
              Enter a referral code to earn 500 XP
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              placeholder="Enter referral code"
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">
              The code should be in the format USER1-ABC123
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isRedeeming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRedeemCode}
              disabled={isRedeeming}
            >
              {isRedeeming ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Redeeming...
                </>
              ) : 'Redeem Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
} 