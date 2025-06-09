import { useState, useEffect } from "react";
import { MainLayout } from "../components/Layout/MainLayout";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import {
  MessageSquare,
  Check,
  Star,
  Sparkles,
  BarChart3,
  Building,
  Dumbbell,
  CalendarDays,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useFeedback, WeeklyFeedbackData } from "../context/FeedbackContext";
import toast from "react-hot-toast";

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
  const [currentWeek, setCurrentWeek] = useState(() => {
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
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 focus:outline-none focus:ring-0`}
          >
            <Star 
              className={`h-6 w-6 ${
                star <= value 
                  ? 'text-yellow-500 fill-yellow-500' 
                  : 'text-gray-300 dark:text-gray-600'
              }`} 
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
      <div className="container px-4 py-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Weekly Feedback</h1>
            <p className="text-sm text-muted-foreground">
              Help us improve your fitness experience
            </p>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <Alert>
                <CalendarDays className="h-4 w-4" />
                <AlertTitle>Week {currentWeek} Feedback</AlertTitle>
                <AlertDescription>
                  Your feedback directly impacts our service improvements and helps us serve you better.
                </AlertDescription>
              </Alert>
            </div>

            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
                {FEEDBACK_CATEGORIES.map((category) => (
                  <TabsTrigger key={category.id} value={category.id} className="flex items-center">
                    {category.icon}
                    <span className="hidden sm:inline">{category.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {FEEDBACK_CATEGORIES.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        {category.icon}
                        {category.name}
                      </CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {Object.entries(category.questions).map(([key, question]) => (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor={key} className="text-sm md:text-base font-medium">
                              {question}
                            </Label>
                            <StarRating 
                              value={ratings[category.id][key]} 
                              onChange={(value) => handleRatingChange(category.id, key, value)} 
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Additional Comments</CardTitle>
                        <CardDescription>
                          Please share any other thoughts or suggestions you have
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Textarea
                          placeholder="We'd love to hear more details about your experience..."
                          rows={4}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="anonymous"
                            checked={isAnonymous}
                            onCheckedChange={setIsAnonymous}
                          />
                          <Label htmlFor="anonymous" className="text-sm">
                            Submit anonymously
                          </Label>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={handlePrevCategory}
                          disabled={submitting || activeCategory === FEEDBACK_CATEGORIES[0].id}
                        >
                          Previous
                        </Button>
                        <div className="flex space-x-2">
                        <Button 
                          onClick={handleSubmit} 
                          disabled={submitting || !hasAnyRating}
                        >
                          {submitting ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                              Submitting...
                            </>
                          ) : (
                            'Submit Feedback'
                          )}
                        </Button>
                        <Button
                          onClick={handleNextCategory}
                          className="gap-2"
                          disabled={submitting || activeCategory === FEEDBACK_CATEGORIES[FEEDBACK_CATEGORIES.length - 1].id}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        </div>
                      </CardFooter>
                    </Card>
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
} 