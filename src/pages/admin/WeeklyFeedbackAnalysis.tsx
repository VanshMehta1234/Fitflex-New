import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FeedbackForm } from "../../context/FeedbackContext";
import { useAuth } from "../../context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  BarChart3,
  Users,
  MessageSquare,
  BarChart,
  RotateCw,
  ChevronDown,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import toast from "react-hot-toast";
import { MainLayout } from "../../components/Layout/MainLayout";
import { supabase } from "../../supabase";

// Helper function to calculate average rating
const calculateAverageRating = (ratings: Record<string, number>): number => {
  const values = Object.values(ratings).filter(v => v > 0);
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

// Helper to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Define Props interface for IndividualFeedback
interface IndividualFeedbackProps {
  filteredFeedback: FeedbackForm[];
  isAdminLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  weekFilter: string;
  setWeekFilter: (filter: string) => void;
  categories: string[];
  weeks: string[];
  setSortBy: (sortBy: string) => void;
  setSortOrder: (sortOrder: "asc" | "desc") => void;
  setViewFeedback: (feedback: FeedbackForm | null) => void;
}

// Define IndividualFeedback component
const IndividualFeedbackComponent: React.FC<IndividualFeedbackProps> = ({
  filteredFeedback,
  isAdminLoading,
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  weekFilter,
  setWeekFilter,
  categories,
  weeks,
  setSortBy,
  setSortOrder,
  setViewFeedback,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1 w-full md:max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search feedback..."
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={weekFilter} onValueChange={setWeekFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by week" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Weeks</SelectItem>
              {weeks.map(week => (
                <SelectItem key={week} value={week}>
                  Week {week.split('-')[1]}, {week.split('-')[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Sort
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('desc'); }}>
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('asc'); }}>
                Oldest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('rating'); setSortOrder('desc'); }}>
                Highest Rating
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy('rating'); setSortOrder('asc'); }}>
                Lowest Rating
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isAdminLoading ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center p-4">
                <RotateCw className="h-6 w-6 animate-spin text-primary mr-2" />
                <p>Loading feedback data...</p>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : filteredFeedback.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Average Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeedback.map(feedback => (
                    <TableRow key={feedback.id}>
                      <TableCell className="font-medium">
                        {formatDate(feedback.submitted_at)}
                      </TableCell>
                      <TableCell>
                        {feedback.week_number ? 
                          `Week ${feedback.week_number}, ${feedback.year}` : 
                          "N/A"}
                      </TableCell>
                      <TableCell>
                        {feedback.is_anonymous 
                          ? <Badge variant="outline">Anonymous</Badge> 
                          : feedback.user?.name || "Unknown User"}
                      </TableCell>
                      <TableCell>
                        {feedback.category.charAt(0).toUpperCase() + feedback.category.slice(1)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="font-medium mr-1">
                            {calculateAverageRating(feedback.ratings).toFixed(1)}
                          </span>
                          <span className="text-yellow-400 text-sm">★</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setViewFeedback(feedback)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="font-medium">No feedback found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm || categoryFilter !== 'all' || weekFilter !== 'all'
                  ? "Try adjusting your search or filters"
                  : "No feedback has been submitted yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Wrap IndividualFeedbackComponent with React.memo
const IndividualFeedback = React.memo(IndividualFeedbackComponent);

// Using React.memo to prevent unnecessary re-renders
const WeeklyFeedbackAnalysis = () => {
  console.log("WeeklyFeedbackAnalysis - Component rendering");
  
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [adminFeedbackForms, setAdminFeedbackForms] = useState<FeedbackForm[]>([]);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewFeedback, setViewFeedback] = useState<FeedbackForm | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Debug logging for monitoring data changes
  useEffect(() => {
    console.log(`WeeklyFeedbackAnalysis - adminFeedbackForms changed, count: ${adminFeedbackForms.length}`);
    //fetch directly from the database
    // const fetchData = async () => { // This fetchData is no longer needed due to getFeedbackData being called in its own useEffect
    //   await getFeedbackData(); // getFeedbackData now sets state directly
    //   // setIsAdminLoading(false); // This is also handled by getFeedbackData
    // };
    
    // Only fetch data if we don't have any yet
    // if (adminFeedbackForms.length === 0) { // This condition can be handled by getFeedbackData or its calling useEffect
    //   fetchData();
    // }
  }, [adminFeedbackForms.length]); // eslint-disable-line react-hooks/exhaustive-deps 
  // TODO: Fix dependencies for getFeedbackData or refactor / This useEffect might need re-evaluation or removal
  
  // Function to enrich feedback data with user information
  const enrichWithUserData = useCallback(async (feedbackData: any[]): Promise<FeedbackForm[]> => {
    const uniqueUserIds = Array.from(new Set(
      feedbackData
        .filter(form => !form.is_anonymous && form.user_id)
        .map(form => form.user_id)
    ));

    if (uniqueUserIds.length === 0) {
      return feedbackData.map(form => ({ ...form, user: form.is_anonymous ? null : undefined })) as FeedbackForm[];
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, email, profile_image")
      .in("id", uniqueUserIds);

    if (profilesError) {
      console.error("Error fetching user profiles:", profilesError);
      // Decide how to handle this - perhaps return data without user info or throw
      return feedbackData.map(form => ({ ...form, user: form.is_anonymous ? null : undefined })) as FeedbackForm[];
    }

    const userProfilesMap: Record<string, any> = {};
    if (profilesData) {
      profilesData.forEach(profile => {
        userProfilesMap[profile.id] = profile;
      });
    }

    return feedbackData.map(form => {
      if (form.is_anonymous || !form.user_id) {
        return { ...form, user: null };
      }
      const profile = userProfilesMap[form.user_id];
      return {
        ...form,
        user: profile ? {
          name: profile.name || 'Unknown User',
          email: profile.email || '',
          profile_image: profile.profile_image || ''
        } : null // Or some default user object
      };
    }) as FeedbackForm[];
  }, []); // Assuming supabase client is stable and globally available

  // Function to fetch feedback data from the database
  const getFeedbackData = useCallback(async () => {
    setIsAdminLoading(true);
    try {
      // Fetch feedback forms
      const response = await supabase
        .from('feedback_forms')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log("Feedback data fetched:", response.data?.length || 0, "records");
      
      // Enrich with user data - ensure enrichWithUserData is stable or memoized if it uses props/state
      const enrichedData = response.data && response.data.length > 0 
        ? await enrichWithUserData(response.data) 
        : [];

      setAdminFeedbackForms(enrichedData);
      
    } catch (error) {
      console.error("Error fetching feedback data:", error);
      toast.error("Failed to load feedback data");
      setAdminFeedbackForms([]); // Clear data on error
    } finally {
      setIsAdminLoading(false); // Ensure loading is false after try/catch/finally
    }
  }, [setIsAdminLoading, enrichWithUserData]); 
  // It's crucial that enrichWithUserData is stable for this to work without adding it to dependencies.
  // If enrichWithUserData is defined within WeeklyFeedbackAnalysis and not memoized, it should be added here,
  // or preferably, also wrapped in useCallback or moved outside the component if it doesn't rely on component scope.
  // Re-added enrichWithUserData to dependency array for getFeedbackData, as it is defined within the component scope.

  // Ensure user is admin
  useEffect(() => {
    if (user && userRole !== 'admin') {
      toast.error("Admin access required");
      navigate('/');
    }
  }, [user, userRole, navigate]);
  
  // Initial data fetch effect
  useEffect(() => {
    // The initial fetch of feedback data.
    // getFeedbackData is wrapped in useCallback, so this effect only re-runs if getFeedbackData identity changes.
    // (which it shouldn't if its own dependencies are stable).
    getFeedbackData();
  }, [getFeedbackData]);

  // Handle refresh with useCallback to prevent recreation on every render
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await getFeedbackData(); // Call the memoized getFeedbackData
      toast.success("Feedback data refreshed");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
      // isAdminLoading is handled by getFeedbackData
    }
  }, [isRefreshing, getFeedbackData]); // Added getFeedbackData to dependencies

  // Extract categories, weeks for filters - memoized to prevent recalculation on every render
  const categories = useMemo(() => 
    Array.from(new Set(adminFeedbackForms.map(f => f.category))),
    [adminFeedbackForms]
  );
  
  const weeks = useMemo(() => 
    Array.from(new Set(adminFeedbackForms
      .map(f => `${f.year}-${f.week_number}`)
      .filter(Boolean)))
      .sort()
      .reverse(),
    [adminFeedbackForms]
  );

  // Calculate stats for overview - memoized to prevent recalculation on every render
  const totalFeedbacks = useMemo(() => adminFeedbackForms.length, [adminFeedbackForms]);
  
  const weeklyFeedbacks = useMemo(() => 
    adminFeedbackForms.filter(f => f.form_type === 'weekly'),
    [adminFeedbackForms]
  );
  
  const avgRatings = useMemo(() => {
    const ratings: Record<string, number> = {};
    categories.forEach(category => {
      const categoryFeedbacks = adminFeedbackForms.filter(f => f.category === category);
      if (categoryFeedbacks.length > 0) {
        const categoryRatings = categoryFeedbacks.map(f => calculateAverageRating(f.ratings));
        ratings[category] = categoryRatings.reduce((sum, val) => sum + val, 0) / categoryRatings.length;
      }
    });
    return ratings;
  }, [adminFeedbackForms, categories]);

  // Apply filters to feedback forms - memoized to prevent recalculation on every render
  const filteredFeedback = useMemo(() => 
    adminFeedbackForms
      .filter(form => {
        // Search term filter
        const searchLower = searchTerm.toLowerCase();
        const userNameMatch = form.user?.name?.toLowerCase().includes(searchLower) || false;
        const commentsMatch = form.comments?.toLowerCase().includes(searchLower) || false;
        const searchMatch = !searchTerm || userNameMatch || commentsMatch;
        
        // Category filter
        const categoryMatch = categoryFilter === 'all' || form.category === categoryFilter;
        
        // Week filter
        const weekMatch = weekFilter === 'all' || 
          `${form.year}-${form.week_number}` === weekFilter;
        
        return searchMatch && categoryMatch && weekMatch;
      })
      .sort((a, b) => {
        // Apply sorting
        if (sortBy === 'date') {
          return sortOrder === 'desc' 
            ? new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
            : new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
        }
        if (sortBy === 'rating') {
          const ratingA = calculateAverageRating(a.ratings);
          const ratingB = calculateAverageRating(b.ratings);
          return sortOrder === 'desc' ? ratingB - ratingA : ratingA - ratingB;
        }
        return 0;
      }),
    [adminFeedbackForms, searchTerm, categoryFilter, weekFilter, sortBy, sortOrder]
  );

  // Memoize uniqueUserCount to prevent recalculation on every render
  const uniqueUserCount = useMemo(() => 
    new Set(adminFeedbackForms.map(f => f.user_id)).size,
    [adminFeedbackForms]
  );

  // Memoize avgTotalRating to prevent recalculation on every render
  const avgTotalRating = useMemo(() => {
    if (totalFeedbacks === 0) return "N/A";
    const avgRating = adminFeedbackForms.reduce((sum, form) => 
      sum + calculateAverageRating(form.ratings), 0) / totalFeedbacks;
    return avgRating.toFixed(1);
  }, [adminFeedbackForms, totalFeedbacks]);

  // Component for Overview tab - memoized to prevent recreation on every render
  const OverviewTab = useMemo(() => () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFeedbacks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {uniqueUserCount} unique users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Weekly Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyFeedbacks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {weeks.length} unique weeks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgTotalRating}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-semibold mt-6">Ratings by Category</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {categories.map(category => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-xl font-bold mr-2">
                  {avgRatings[category]?.toFixed(1) || "N/A"}
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <div key={star} className="text-yellow-400">
                      {star <= Math.round(avgRatings[category] || 0) ? "★" : "☆"}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {adminFeedbackForms.filter(f => f.category === category).length} feedbacks
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h3 className="text-lg font-semibold mt-6">Recent Feedback</h3>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminFeedbackForms.slice(0, 5).map(feedback => (
                <TableRow key={feedback.id}>
                  <TableCell className="font-medium">
                    {formatDate(feedback.submitted_at)}
                  </TableCell>
                  <TableCell>
                    {feedback.is_anonymous 
                      ? <Badge variant="outline">Anonymous</Badge> 
                      : feedback.user?.name || "Unknown User"}
                  </TableCell>
                  <TableCell>
                    {feedback.category.charAt(0).toUpperCase() + feedback.category.slice(1)}
                  </TableCell>
                  <TableCell>
                    {calculateAverageRating(feedback.ratings).toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setViewFeedback(feedback)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  ), [totalFeedbacks, uniqueUserCount, weeklyFeedbacks.length, weeks.length, avgTotalRating, categories, avgRatings, adminFeedbackForms, setViewFeedback]);

  return (
    <MainLayout>
      <div className="container px-4 py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Feedback Analysis</h1>
              <p className="text-sm text-muted-foreground">
                Analyze and track member feedback
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isAdminLoading}
          >
            {isRefreshing ? (
              <>
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RotateCw className="h-4 w-4 mr-2" />
                Refresh Data
              </>
            )}
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-border overflow-x-auto no-scrollbar">
            <TabsList className="mb-0 w-full rounded-none bg-transparent flex p-0 h-auto">
              <TabsTrigger 
                value="overview" 
                className="flex flex-col items-center justify-center py-3 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none h-16"
              >
                <BarChart3 className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="individual" 
                className="flex flex-col items-center justify-center py-3 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none h-16"
              >
                <Users className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Individual</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          
          <TabsContent value="individual">
            <IndividualFeedback
              filteredFeedback={filteredFeedback}
              isAdminLoading={isAdminLoading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              weekFilter={weekFilter}
              setWeekFilter={setWeekFilter}
              categories={categories}
              weeks={weeks}
              setSortBy={setSortBy}
              setSortOrder={setSortOrder}
              setViewFeedback={setViewFeedback}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Feedback Details Dialog */}
      {viewFeedback && (
        <Dialog open={!!viewFeedback} onOpenChange={() => setViewFeedback(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Feedback Details</DialogTitle>
              <DialogDescription>
                Submitted on {formatDate(viewFeedback.submitted_at)}
                {viewFeedback.week_number && 
                  ` - Week ${viewFeedback.week_number}, ${viewFeedback.year}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">User</h3>
                  <p>{viewFeedback.is_anonymous 
                    ? "Anonymous User" 
                    : viewFeedback.user?.name || "Unknown User"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
                  <p>{viewFeedback.category.charAt(0).toUpperCase() + viewFeedback.category.slice(1)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Ratings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(viewFeedback.ratings).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm">
                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                      <div className="flex items-center">
                        <span className="mr-1 font-medium">{value}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <div key={star} className="text-yellow-400 text-sm">
                              {star <= value ? "★" : "☆"}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {viewFeedback.comments && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Comments</h3>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {viewFeedback.comments}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
};

export default WeeklyFeedbackAnalysis; 