import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { useXp } from "./XpContext";
import {
  Referral,
  ReferralRedemption,
  createReferral,
  getUserReferrals,
  redeemReferralCode,
  getReferralRedemptions,
  getStoredReferralCode
} from "../lib/referralService";

// Context type
type ReferralContextType = {
  referrals: Referral[];
  activeReferral: Referral | null;
  referralRedemptions: ReferralRedemption[];
  isLoading: boolean;
  loadingStartTime: number | null;
  hasReferral: boolean;
  createNewReferral: () => Promise<boolean>;
  redeemCode: (code: string) => Promise<boolean>;
  refreshReferrals: () => Promise<void>;
  currentOperation: string | null;
  resetOperationState: () => void;
};

// Create context
const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

// Provider component
export function ReferralProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { refreshXpData } = useXp();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [activeReferral, setActiveReferral] = useState<Referral | null>(null);
  const [referralRedemptions, setReferralRedemptions] = useState<ReferralRedemption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  
  // Tracking refs
  const currentOperationRef = useRef<string | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const initialFetchedForUserRef = useRef<string | null>(null);
  const codeRedeemingRef = useRef<{[code: string]: boolean}>({});
  
  // Constants
  const MAX_LOADING_TIME = 20000; // 20 seconds
  const OPERATION_RESET_DELAY = 15000; // 15 seconds

  // Calculate if user has an active referral code
  const hasReferral = activeReferral !== null;

  // Function to clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach(id => window.clearTimeout(id));
    timeoutIdsRef.current = [];
  }, []);

  // Setup guard timeout when loading
  useEffect(() => {
    if (isLoading && !loadingStartTime) {
      const startTime = Date.now();
      setLoadingStartTime(startTime);
      
      const timeoutId = window.setTimeout(() => {
        console.error(`Operation "${currentOperationRef.current}" timed out after ${MAX_LOADING_TIME}ms`);
        setIsLoading(false);
        currentOperationRef.current = null;
        toast.error("The operation is taking too long. Please try again.");
      }, MAX_LOADING_TIME);
      
      timeoutIdsRef.current.push(timeoutId);
      
      return () => {
        window.clearTimeout(timeoutId);
      };
    }
    
    if (!isLoading && loadingStartTime) {
      setLoadingStartTime(null);
    }
  }, [isLoading, loadingStartTime]);

  // Add a force reset mechanism to unblock stuck operations
  const resetOperationState = useCallback(() => {
    console.log("Forcing operation state reset");
    clearAllTimeouts();
    currentOperationRef.current = null;
    setIsLoading(false);
    setLoadingStartTime(null);
    codeRedeemingRef.current = {}; // Reset any in-progress code redemptions
  }, [clearAllTimeouts]);

  // Clean up all timeouts when component unmounts
  useEffect(() => {
    // Force reset operation state after a short delay on mount
    const resetId = window.setTimeout(() => {
      if (currentOperationRef.current) {
        console.warn(`Found stale operation "${currentOperationRef.current}" on mount, resetting`);
        resetOperationState();
      }
    }, 1000);
    
    return () => {
      window.clearTimeout(resetId);
      clearAllTimeouts();
    };
  }, [clearAllTimeouts, resetOperationState]);

  // Guard function to start operations safely
  const startOperation = useCallback((operationName: string): boolean => {
    // If there's already an operation in progress
    if (isLoading && currentOperationRef.current) {
      // If it's the same operation, that's fine (idempotent)
      if (currentOperationRef.current === operationName) {
        console.log(`Operation "${operationName}" already in progress, continuing`);
        return true;
      }
      
      // If the current operation has been running for too long, force reset
      if (loadingStartTime && (Date.now() - loadingStartTime > OPERATION_RESET_DELAY)) {
        console.warn(`Forcing reset of stale operation "${currentOperationRef.current}" after ${OPERATION_RESET_DELAY}ms`);
        resetOperationState();
        // Continue with the new operation after reset
      } else {
        // Otherwise, don't start a new operation
        console.warn(`Cannot start ${operationName} - "${currentOperationRef.current}" is already in progress`);
        toast.error("Another operation is in progress. Please try again in a moment.");
        return false;
      }
    }
    
    // Start this operation
    currentOperationRef.current = operationName;
    setIsLoading(true);
    console.log(`Starting operation: ${operationName}`);
    return true;
  }, [isLoading, loadingStartTime, resetOperationState]);
  
  // Function to safely end operations
  const endOperation = useCallback((operationName: string, success: boolean = true) => {
    // Only end if this is the current operation
    if (currentOperationRef.current === operationName) {
      console.log(`Ending operation: ${operationName}, success: ${success}`);
      setIsLoading(false);
      currentOperationRef.current = null;
    } else if (currentOperationRef.current) {
      console.warn(`Attempted to end operation ${operationName} but current operation is ${currentOperationRef.current}`);
    } else {
      console.warn(`Attempted to end operation ${operationName} but no operation is in progress`);
    }
  }, []);

  // Load referral data on mount or when user changes
  useEffect(() => {
    // Skip if no user
    if (!user) {
      console.log("No user, skipping initial fetch");
      return;
    }
    
    // Skip if we already fetched for this user
    if (initialFetchedForUserRef.current === user.id) {
      console.log(`Already fetched initial data for user ${user.id}, skipping duplicate fetch`);
      return;
    }
    
    console.log("User ID changed or first load, fetching referral data", { 
      userId: user?.id,
      previousUserId: initialFetchedForUserRef.current 
    });
    
    // Skip initial fetch if there's already an operation in progress
    if (isLoading && currentOperationRef.current) {
      console.log(`Skipping initial fetch because ${currentOperationRef.current} is in progress`);
      return;
    }
    
    // Mark that we've fetched for this user ID
    initialFetchedForUserRef.current = user.id;
    
    // Initial data fetch doesn't need full operation tracking
    const fetchInitialData = async () => {
      try {
        // Set loading but don't track as a named operation
        if (!isLoading) {
          setIsLoading(true);
        }
        
        // Create a timeout for this specific fetch
        const fetchTimeout = setTimeout(() => {
          console.warn("Initial data fetch timed out");
          setIsLoading(false);
        }, 10000);
        
        // Fetch the data
        await fetchReferralData();
        
        // Clear timeout and loading state
        clearTimeout(fetchTimeout);
        setIsLoading(false);
      } catch (error) {
        console.error("Error in initial data fetch:", error);
        setIsLoading(false);
      }
    };
    
    // Execute the fetch
    fetchInitialData();
    
  }, [user?.id]);

  // Fetch user's referrals and redemptions
  const fetchReferralData = async () => {
    console.log("fetchReferralData started", { userId: user?.id });
    if (!user) {
      console.log("No user found, clearing referral data");
      setReferrals([]);
      setActiveReferral(null);
      setReferralRedemptions([]);
      return;
    }

    try {
      console.log("Fetching user referrals for:", user.id);
      
      // Fetch user's referrals with timeout safety
      const referralsPromise = new Promise<Referral[]>(async (resolve, reject) => {
        try {
          const timeoutId = setTimeout(() => {
            reject(new Error("Referral fetch timed out"));
          }, 8000);
          
          const referrals = await getUserReferrals(user.id);
          clearTimeout(timeoutId);
          resolve(referrals);
        } catch (error) {
          reject(error);
        }
      });
      
      // Get referrals
      let userReferrals: Referral[];
      try {
        userReferrals = await referralsPromise;
        console.log(`Fetched ${userReferrals.length} referrals`);
        setReferrals(userReferrals);
        
        // Set active referral (most recent active one)
        const activeReferrals = userReferrals.filter(r => r.is_active);
        if (activeReferrals.length > 0) {
          setActiveReferral(activeReferrals[0]);
        } else {
          setActiveReferral(null);
        }
      } catch (error) {
        console.error("Error fetching referrals:", error);
        // Try to use localStorage as fallback for referral code
        const storedReferral = getStoredReferralCode(user.id);
        if (storedReferral) {
          console.log("Using stored referral from localStorage:", storedReferral);
          // We don't have full referral object, so we'll set a minimal one
          setActiveReferral({
            id: storedReferral.id,
            referrer_id: user.id,
            referral_code: storedReferral.code,
            created_at: new Date().toISOString(),
            uses_count: 0,
            max_uses: 10,
            reward_xp: 500,
            reward_points: 0,
            is_active: true
          });
        }
        userReferrals = [];
      }
      
      // Fetch redemptions if we have referrals
      if (userReferrals.length > 0) {
        try {
          console.log("Fetching referral redemptions");
          const redemptions = await getReferralRedemptions(user.id);
          console.log(`Fetched ${redemptions.length} redemptions`);
          setReferralRedemptions(redemptions);
        } catch (error) {
          console.error("Error fetching redemptions:", error);
          setReferralRedemptions([]);
        }
      } else {
        setReferralRedemptions([]);
      }
    } catch (error) {
      console.error("Error in fetchReferralData:", error);
      setReferrals([]);
      setActiveReferral(null);
      setReferralRedemptions([]);
    }
  };

  // Redeem a referral code
  const redeemCode = async (code: string): Promise<boolean> => {
    console.log("redeemCode started with code:", code);
    
    if (!user) {
      toast.error("You must be logged in to redeem a code");
      return false;
    }
    
    // Check if we're already processing this code
    if (codeRedeemingRef.current[code]) {
      console.log("Already processing this code, ignoring duplicate request");
      return false;
    }
    
    // Prevent self-redemption by checking against active referral
    if (activeReferral && activeReferral.referral_code === code) {
      toast.error("You cannot redeem your own referral code");
      return false;
    }
    
    // Start the redeem operation
    const operationName = `redeem-code-${code}`;
    if (!startOperation(operationName)) {
      return false;
    }
    
    // Mark this code as being processed
    codeRedeemingRef.current[code] = true;
    
    try {
      const success = await redeemReferralCode(code, user.id);
      
      if (success) {
        toast.success("Referral code redeemed successfully!");
        
        // Refresh XP data to update UI
        await refreshXpData();
        
        // Refresh data after successful redemption
        await fetchReferralData();
        
        endOperation(operationName, true);
        delete codeRedeemingRef.current[code];
        return true;
      } else {
        toast.error("Failed to redeem code. It may be invalid or already used.");
        endOperation(operationName, false);
        delete codeRedeemingRef.current[code];
        return false;
      }
    } catch (error) {
      console.error("Error redeeming code:", error);
      toast.error("An error occurred while redeeming the code");
      endOperation(operationName, false);
      delete codeRedeemingRef.current[code];
      return false;
    }
  };

  // Create a new referral
  const createNewReferral = async (): Promise<boolean> => {
    console.log("createNewReferral started");
    
    if (!user) {
      toast.error("You must be logged in to create a referral code");
      return false;
    }
    
    // Start the create operation
    const operationName = "create-referral";
    if (!startOperation(operationName)) {
      return false;
    }
    
    try {
      const newReferral = await createReferral(user.id);
      
      if (newReferral) {
        console.log("New referral created:", newReferral);
        
        // Update state with the new referral
        setReferrals(prev => [newReferral, ...prev]);
        setActiveReferral(newReferral);
        
        toast.success("New referral code created successfully!");
        endOperation(operationName, true);
        return true;
      } else {
        toast.error("Failed to create referral code");
        endOperation(operationName, false);
        return false;
      }
    } catch (error) {
      console.error("Error creating referral:", error);
      toast.error("An error occurred while creating the referral code");
      endOperation(operationName, false);
      return false;
    }
  };

  // Refresh referrals and redemptions
  const refreshReferrals = async (): Promise<void> => {
    console.log("refreshReferrals started");
    
    if (!user) {
      console.log("No user, skipping refresh");
      return;
    }
    
    // Start the refresh operation
    const operationName = "refresh-referrals";
    if (!startOperation(operationName)) {
      return;
    }
    
    try {
      await fetchReferralData();
      endOperation(operationName, true);
    } catch (error) {
      console.error("Error refreshing referrals:", error);
      toast.error("Failed to refresh referral data");
      endOperation(operationName, false);
    }
  };

  return (
    <ReferralContext.Provider
      value={{
        referrals,
        activeReferral,
        referralRedemptions,
        isLoading,
        loadingStartTime,
        hasReferral,
        createNewReferral,
        redeemCode,
        refreshReferrals,
        currentOperation: currentOperationRef.current,
        resetOperationState
      }}
    >
      {children}
    </ReferralContext.Provider>
  );
}

// Hook to use the referral context
export function useReferral() {
  const context = useContext(ReferralContext);
  if (context === undefined) {
    throw new Error("useReferral must be used within a ReferralProvider");
  }
  return context;
} 