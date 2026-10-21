import { format, parseISO } from "date-fns";
import { ArrowLeft, Calendar as CalendarIcon, CheckCircle, Clock, Dumbbell, MapPin, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { ClassCancelModal } from "../components/ClassCancelModal";
import { PageContainer } from "../components/Layout";
import { MainLayout } from "../components/Layout/MainLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import { useAuth } from "../context/AuthContext";
import { useClasses } from "../context/ClassContext";
import { Class, getClassById } from "../lib/classService";

export default function ClassDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isClassBooked, bookClass, cancelBooking, getBookingForClass, refreshClasses } = useClasses();
  
  const [classData, setClassData] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  
  useEffect(() => {
    async function fetchClassData() {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await getClassById(id);
        setClassData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching class:", err);
        setError("Failed to load class data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchClassData();
  }, [id]);
  
  // After booking or cancellation, refresh class data
  const refreshClassData = async () => {
    if (!id) return;
    
    try {
      const data = await getClassById(id);
      setClassData(data);
      await refreshClasses();
    } catch (err) {
      console.error("Error refreshing class data:", err);
    }
  };
  
  // Handle booking a class
  const handleBookClass = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!classData) return;
    
    try {
      await bookClass(classData.id);
      toast.success(`You have booked ${classData.name}`);
      refreshClassData();
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Failed to book class";
      toast.error(errorMessage);
    }
  };
  
  // Handle cancelling a booking
  const handleCancelBooking = async (cls: Class) => {
    const booking = getBookingForClass(cls.id);
    if (!booking) return;
    
    try {
      await cancelBooking(booking.id);
      toast.success(`Your booking for ${cls.name} has been cancelled`);
      setIsCancelDialogOpen(false);
      refreshClassData();
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Failed to cancel booking";
      toast.error(errorMessage);
    }
  };
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };
  
  // Calculate capacity percentage
  const getCapacityPercentage = (cls: Class) => {
    if (cls.available_spots === undefined || cls.capacity === 0) return 0;
    const bookedSpots = cls.capacity - cls.available_spots;
    return (bookedSpots / cls.capacity) * 100;
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <PageContainer>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-3">Loading class details...</span>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }
  
  if (error || !classData) {
    return (
      <MainLayout>
        <PageContainer>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-xl font-medium mb-2">Class Not Found</h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                {error || "The class you're looking for could not be found."}
              </p>
              <Button onClick={() => navigate('/classes')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Classes
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </MainLayout>
    );
  }
  
  const isBooked = isClassBooked(classData.id);
  const isFull = classData.available_spots !== undefined && classData.available_spots <= 0;
  const capacityPercentage = getCapacityPercentage(classData);
  
  return (
    <MainLayout>
      <PageContainer>
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate('/classes')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Classes
        </Button>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Class Header */}
          <div className="relative">
            {classData.image_url ? (
              <div className="aspect-video w-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <img 
                  src={classData.image_url} 
                  alt={classData.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video w-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Dumbbell className="h-20 w-20 text-white opacity-50" />
              </div>
            )}
            
            {isBooked && (
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-green-800 dark:text-green-300">You're booked for this class!</h3>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      See you on {formatDate(classData.date)} at {classData.time}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{classData.name}</h1>
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <User className="h-4 w-4 mr-1.5" />
                  <span>Instructor: {classData.instructor}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 md:text-right">
                <div className="flex items-center md:justify-end text-lg font-medium">
                  <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span>{formatDate(classData.date)}</span>
                </div>
                <div className="flex items-center md:justify-end text-lg">
                  <Clock className="h-5 w-5 text-gray-500 mr-2" />
                  <span>{classData.time} ({classData.duration} mins)</span>
                </div>
              </div>
            </div>
            
            {classData.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-700 dark:text-gray-300">{classData.description}</p>
              </div>
            )}
            
            <Separator className="my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Class Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Location</p>
                    <div className="flex items-center text-lg">
                      <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                      <span>{classData.location}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Class Type</p>
                    <div className="flex items-center text-lg">
                      <Dumbbell className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="capitalize">{classData.type}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Experience Level</p>
                    <div className="flex items-center text-lg">
                      <Badge variant={
                        classData.level === 'beginner' ? 'default' :
                        classData.level === 'intermediate' ? 'secondary' :
                        classData.level === 'advanced' ? 'destructive' : 'outline'
                      } className="capitalize">
                        {classData.level}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Availability</h2>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="font-medium">Class Capacity</span>
                    </div>
                    <span className="font-medium">
                      {classData.available_spots !== undefined
                        ? `${classData.capacity - classData.available_spots}/${classData.capacity}`
                        : `${classData.capacity} total spots`
                      }
                    </span>
                  </div>
                  
                  <Progress value={capacityPercentage} className="h-2 mb-4" />
                  
                  {classData.available_spots !== undefined && (
                    <div className="text-center text-sm font-medium mt-2">
                      {classData.available_spots > 0 
                        ? `${classData.available_spots} spots available`
                        : "This class is fully booked"
                      }
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  {isBooked ? (
                    <Button 
                      variant="outline" 
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setIsCancelDialogOpen(true)}
                    >
                      Cancel Booking
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      disabled={isFull}
                      onClick={handleBookClass}
                    >
                      {isFull ? 'Class Full' : 'Book Class'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Custom Cancel Modal */}
        <ClassCancelModal
          isOpen={isCancelDialogOpen}
          onClose={() => setIsCancelDialogOpen(false)}
          selectedClass={classData}
          onCancelBooking={handleCancelBooking}
        />
      </PageContainer>
    </MainLayout>
  );
}
