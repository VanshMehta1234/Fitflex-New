import { BarChart3, Building, CalendarDays, Check, Clock, Dumbbell, MessageSquare, Sparkles, Star } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MainLayout } from "../components/Layout/MainLayout";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { useFeedback, WeeklyFeedbackData } from "../context/FeedbackContext";
import { cn } from "../lib/utils";

// Categories for the weekly feedback
const FEEDBACK_CATEGORIES = [
  {
    id: "services",
    name: "Gym Services",
    icon: <BarChart3 className="h-5 w-5 mr-2" />,
    description: "Rate our classes, trainers, and overall service quality",
    questions: {
      "class_quality": "Class Quality",
      "trainer_expertise": "Trainer Expertise",
      "schedule_convenience": "Schedule Convenience",
      "customer_service": "Customer Service"
    }
  },
  {
    id: "facilities",
    name: "Gym Facilities",
    icon: <Building className="h-5 w-5 mr-2" />,
    description: "Rate our gym facilities, cleanliness, and equipment",
    questions: {
      "cleanliness": "Cleanliness",
      "equipment_maintenance": "Equipment Maintenance",
      "locker_rooms": "Locker Room Facilities",
      "gym_layout": "Gym Layout & Accessibility"
    }
  },
  {
    id: "experience",
    name: "Member Experience",
    icon: <Sparkles className="h-5 w-5 mr-2" />,
    description: "Tell us about your overall experience and satisfaction",
    questions: {
      "overall_satisfaction": "Overall Satisfaction",
      "value_for_money": "Value for Money",
      "community_feeling": "Sense of Community",
      "app_experience": "App/Website Experience"
    }
  },
  {
    id: "improvements",
    name: "Improvement Ideas",
    icon: <Dumbbell className="h-5 w-5 mr-2" />,
    description: "Share your suggestions for improvements or new features",
    questions: {
      "equipment_suggestions": "Equipment Suggestions",
      "class_suggestions": "Class Suggestions",
      "facility_improvements": "Facility Improvements",
      "app_improvements": "App/Digital Improvements"
    }
  }
];

export default function WeeklyFeedback() {
  const { submitWeeklyFeedback, hasSubmittedThisWeek, isLoading, getCurrentWeekFeedback } = useFeedback();
  const [activeCategory, setActiveCategory] = useState(FEEDBACK_CATEGORIES[0].id);
  const [ratings, setRatings] = useState<Record<string, Record<string, number>>>({
    services: {
      "class_quality": 0,
      "trainer_expertise": 0,
      "schedule_convenience": 0,
      "customer_service": 0
    },
    facilities: {
      "cleanliness": 0,
      "equipment_maintenance": 0,
      "locker_rooms": 0,
      "gym_layout": 0
    },
    experience: {
      "overall_satisfaction": 0,
      "value_for_money": 0,
      "community_feeling": 0,
      "app_experience": 0
    },
    improvements: {
      "equipment_suggestions": 0,
      "class_suggestions": 0,
      "facility_improvements": 0,
      "app_improvements": 0
    }
  });
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasAnyRating, setHasAnyRating] = useState(false);
  const [currentWeek] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 604800000; // milliseconds in a week
    return Math.floor(diff / oneWeek) + 1;
  });

  const currentFeedback = getCurrentWeekFeedback();

  // Check if user has provided any rating
  useEffect(() => {
    const hasRating = Object.keys(ratings).some(category => 
      Object.values(ratings[category]).some(rating => rating > 0)
    );
    setHasAnyRating(hasRating);
  }, [ratings]);

  const handleRatingChange = (category: string, question: string, value: number) => {
    setRatings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [question]: value
      }
    }));
  };

  const validateForm = () => {
    // Check if at least one rating is provided
    if (!hasAnyRating) {
      toast.error("Please provide at least one rating");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      // Collect all ratings from all categories
      const allRatings: Record<string, number> = {};
      
      // Merge all rating categories into one object
      Object.keys(ratings).forEach(category => {
        Object.entries(ratings[category]).forEach(([key, value]) => {
          if (value > 0) {
            allRatings[`${category}_${key}`] = value;
          }
        });
      });
      
      // Prepare feedback data with all ratings
      const feedbackData: WeeklyFeedbackData = {
        category: activeCategory, // Use active category as primary category
        ratings: allRatings,
        comments: comment,
        is_anonymous: isAnonymous
      };
      
      await submitWeeklyFeedback(feedbackData);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextCategory = () => {
    if (!validateForm()) return;
    
    const currentIndex = FEEDBACK_CATEGORIES.findIndex(c => c.id === activeCategory);
    if (currentIndex < FEEDBACK_CATEGORIES.length - 1) {
      setActiveCategory(FEEDBACK_CATEGORIES[currentIndex + 1].id);
    }
  };

  const handlePrevCategory = () => {
    const currentIndex = FEEDBACK_CATEGORIES.findIndex(c => c.id === activeCategory);
    if (currentIndex > 0) {
      setActiveCategory(FEEDBACK_CATEGORIES[currentIndex - 1].id);
    }
  };

  const StarRating = ({ value, onChange }: { value: number, onChange: (value: number) => void }) => {
    return (
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full transition-all"
            aria-label={`Rate ${star} out of 5`}
          >
            <Star 
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 transition-all",
                star <= value 
                  ? "text-yellow-500 fill-yellow-500" 
                  : "text-gray-300 dark:text-gray-600 hover:text-yellow-400"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  if (hasSubmittedThisWeek && currentFeedback) {
    // Show a thank you message if the user already submitted feedback this week
    return (
      <MainLayout>
        <div className="container px-4 py-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Thank You!</h1>
              <p className="text-sm text-muted-foreground">
                You've already submitted your feedback for this week
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Feedback Submitted</CardTitle>
              <CardDescription>
                Your feedback helps us improve our services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CalendarDays className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>Week {currentFeedback.week_number}, {currentFeedback.year}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>Submitted on {new Date(currentFeedback.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Your feedback matters!</AlertTitle>
                  <AlertDescription>
                    We review all feedback weekly to continuously improve our gym services and facilities.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Weekly Feedback</h1>
            <p className="text-sm text-muted-foreground">
              Help us improve your fitness experience
            </p>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              <CardTitle>Week {currentWeek} Feedback</CardTitle>
            </div>
            <CardDescription>
              Your feedback directly impacts our service improvements and helps us serve you better.
            </CardDescription>
          </CardHeader>
        </Card>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <>
            {/* Custom tabs UI that looks better on mobile */}
            <div className="mb-6 overflow-x-auto no-scrollbar">
              <div className="flex w-full border-b dark:border-gray-800">
                {FEEDBACK_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center py-3 px-1 min-w-[80px] transition-colors relative",
                      activeCategory === category.id
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center mb-1",
                      activeCategory === category.id
                        ? "bg-primary/10"
                        : "bg-muted"
                    )}>
                      {React.cloneElement(category.icon, {
                        className: cn(
                          "h-5 w-5",
                          activeCategory === category.id
                            ? "text-primary"
                            : "text-muted-foreground"
                        )
                      })}
                    </div>
                    <span className="text-xs font-medium truncate max-w-[90px]">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category content */}
            <div className="space-y-6">
              {FEEDBACK_CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  className={activeCategory === category.id ? "block" : "hidden"}
                >
                  <Card className="shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center">
                        {React.cloneElement(category.icon, { className: "h-5 w-5 mr-2 text-primary" })}
                        <CardTitle>{category.name}</CardTitle>
                      </div>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                        {Object.entries(category.questions).map(([key, question]) => (
                          <div key={key} className="space-y-2 p-3 rounded-lg border bg-card">
                            <div className="flex justify-between items-baseline">
                              <Label htmlFor={key} className="font-medium">
                                {question}
                              </Label>
                              <span className="text-sm text-muted-foreground font-medium">
                                {ratings[category.id][key] > 0 ? `${ratings[category.id][key]}/5` : "Not rated"}
                              </span>
                            </div>
                            <StarRating
                              value={ratings[category.id][key]}
                              onChange={(value) =>
                                handleRatingChange(category.id, key, value)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              
              {/* Comments section - always visible */}
              <Card className="mt-6 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                    Additional Comments
                  </CardTitle>
                  <CardDescription>
                    Share any additional thoughts or suggestions with us
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Your comments here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex items-center space-x-2 mt-4">
                    <Switch
                      id="anonymous"
                      checked={isAnonymous}
                      onCheckedChange={setIsAnonymous}
                    />
                    <Label htmlFor="anonymous">Submit anonymously</Label>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-4 border-t pt-6 px-6">
                  <Button
                    variant="outline"
                    onClick={handlePrevCategory}
                    disabled={FEEDBACK_CATEGORIES[0].id === activeCategory}
                    className="w-full sm:w-auto"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    {FEEDBACK_CATEGORIES[FEEDBACK_CATEGORIES.length - 1].id !== activeCategory && (
                      <Button
                        onClick={handleNextCategory}
                        className="flex-1 sm:flex-none"
                      >
                        Next
                      </Button>
                    )}
                    
                    <Button
                      variant={FEEDBACK_CATEGORIES[FEEDBACK_CATEGORIES.length - 1].id === activeCategory ? "default" : "outline"}
                      disabled={submitting || !hasAnyRating}
                      onClick={handleSubmit}
                      className="flex-1 sm:flex-none"
                    >
                      {submitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
