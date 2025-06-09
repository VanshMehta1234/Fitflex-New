import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useClasses } from "../context/ClassContext";
import { MainLayout } from "../components/Layout/MainLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { ClassBookingModal } from "../components/ClassBookingModal";
import { ClassCancelModal } from "../components/ClassCancelModal";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Dumbbell, 
  CheckCircle, 
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { 
  format, 
  parseISO, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfDay
} from "date-fns";
import { Class } from "../lib/classService";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";

// Type for grouped classes by date
type ClassesByDate = {
  [date: string]: Class[];
};

export default function Classes() {
  const { user } = useAuth();
  const { classes, userBookings, isLoading, bookClass, cancelBooking, isClassBooked, getBookingForClass } = useClasses();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

  // Get all days in the current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Filter classes by search term, type, level
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || cls.type === filterType;
    const matchesLevel = filterLevel === "all" || cls.level === filterLevel;
    
    return matchesSearch && matchesType && matchesLevel;
  });

  // Group classes by date for calendar view
  const classesByDate: ClassesByDate = filteredClasses.reduce((acc, cls) => {
    if (!acc[cls.date]) {
      acc[cls.date] = [];
    }
    acc[cls.date].push(cls);
    return acc;
  }, {} as ClassesByDate);

  // Filter classes for selected date in calendar view
  const classesForSelectedDate = classesByDate[format(selectedDate, 'yyyy-MM-dd')] || [];

  // Handle month navigation
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Handle booking a class
  const handleBookClass = async (cls: Class) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      await bookClass(cls.id);
      toast.success(`You have booked ${cls.name} on ${format(parseISO(cls.date), 'MMM d, yyyy')} at ${cls.time}`);
      setIsBookingModalOpen(false);
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
      setIsCancelModalOpen(false);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Failed to cancel booking";
      toast.error(errorMessage);
    }
  };

  // Show class details
  const showClassDetails = (cls: Class) => {
    setSelectedClass(cls);
    setIsBookingModalOpen(true);
  };

  // Show cancel confirmation
  const showCancelConfirmation = (cls: Class) => {
    setSelectedClass(cls);
    setIsCancelModalOpen(true);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  // Calculate the capacity percentage
  const getCapacityPercentage = (cls: Class) => {
    if (cls.available_spots === undefined || cls.capacity === 0) return 0;
    const bookedSpots = cls.capacity - cls.available_spots;
    return (bookedSpots / cls.capacity) * 100;
  };

  // Render class card
  const renderClassCard = (cls: Class) => {
    const isBooked = isClassBooked(cls.id);
    const isFull = cls.available_spots !== undefined && cls.available_spots <= 0;
    const capacityPercentage = getCapacityPercentage(cls);
    
    return (
      <Card key={cls.id} className={cn(
        "overflow-hidden",
        isBooked && "border-green-500 border-2"
      )}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{cls.name}</CardTitle>
              <CardDescription>{cls.instructor}</CardDescription>
            </div>
            {isBooked && (
              <Badge variant="success" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Booked
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <CalendarIcon className="h-4 w-4 text-gray-500 mr-2" />
              <span>{formatDate(cls.date)}</span>
            </div>
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span>{cls.time} ({cls.duration} mins)</span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 text-gray-500 mr-2" />
              <span>{cls.location}</span>
            </div>
            <div className="flex items-center text-sm">
              <Dumbbell className="h-4 w-4 text-gray-500 mr-2" />
              <span className="capitalize">{cls.type} - {cls.level}</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Capacity:</span>
                <span>{cls.available_spots !== undefined ? `${cls.capacity - cls.available_spots}/${cls.capacity}` : `${cls.capacity} spots`}</span>
              </div>
              <Progress value={capacityPercentage} className="h-2" />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-0">
          {isBooked ? (
            <Button 
              variant="outline" 
              className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => showCancelConfirmation(cls)}
            >
              Cancel Booking
            </Button>
          ) : (
            <Button 
              className="w-full"
              disabled={isFull}
              onClick={() => showClassDetails(cls)}
            >
              {isFull ? 'Class Full' : 'Book Class'}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  // Render calendar day cells
  const renderCalendarDay = (day: Date) => {
    const formattedDay = format(day, 'yyyy-MM-dd');
    const classesOnDay = classesByDate[formattedDay] || [];
    const hasClasses = classesOnDay.length > 0;
    const isSelected = isSameDay(day, selectedDate);
    const isPast = isBefore(day, startOfDay(new Date())) && !isToday(day);
    
    // Check if user has any bookings on this day
    const hasBookings = classesOnDay.some(cls => isClassBooked(cls.id));
    
    return (
      <div 
        key={day.toString()}
        className={cn(
          "h-14 p-1 border rounded-md",
          !isSameMonth(day, currentMonth) && "opacity-40 bg-gray-50 dark:bg-gray-800/20",
          isSelected && "border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20",
          isToday(day) && "font-bold",
          hasClasses && !isPast && "bg-green-50 dark:bg-green-900/10",
          hasBookings && !isPast && "ring-2 ring-green-500 dark:ring-green-400",
          "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
        )}
        onClick={() => setSelectedDate(day)}
      >
        <div className="text-center">
          <div className={cn(
            "text-sm",
            isToday(day) && "bg-primary-500 dark:bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto"
          )}>
            {format(day, 'd')}
          </div>
          {hasClasses && (
            <div className="flex justify-center mt-1 space-x-1">
              {classesOnDay.length > 3 ? (
                <span className="text-xs bg-green-500 text-white px-1 rounded-sm">{classesOnDay.length}</span>
              ) : (
                classesOnDay.map((cls, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isClassBooked(cls.id) ? "bg-blue-500" : "bg-green-500"
                    )}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container px-4 py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Fitness Classes</h1>
          
          <div className="flex gap-2">
            <Tabs 
              defaultValue={viewMode} 
              value={viewMode}
              onValueChange={(value: string) => setViewMode(value as 'list' | 'calendar')} 
              className="hidden sm:block"
            >
              <TabsList>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Class Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="yoga">Yoga</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="hiit">HIIT</SelectItem>
                <SelectItem value="dance">Dance</SelectItem>
                <SelectItem value="pilates">Pilates</SelectItem>
                <SelectItem value="cycling">Cycling</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="all levels">Mixed Levels</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            <span className="ml-3">Loading classes...</span>
          </div>
        ) : (
          <>
            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <div className="space-y-6">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous Month
                  </Button>
                  
                  <h2 className="text-xl font-semibold">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h2>
                  
                  <Button variant="outline" size="sm" onClick={handleNextMonth}>
                    Next Month
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                
                {/* Calendar Grid */}
                <div>
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-medium py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {daysInMonth.map(renderCalendarDay)}
                  </div>
                </div>
                
                {/* Classes for Selected Date */}
                <div>
                  <h3 className="font-medium text-lg mb-3">
                    Classes on {format(selectedDate, 'MMMM d, yyyy')}
                  </h3>
                  
                  {classesForSelectedDate.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {classesForSelectedDate.map(renderClassCard)}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <CalendarIcon className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-xl font-medium mb-2">No Classes Scheduled</h3>
                        <p className="text-gray-500 text-center max-w-md">
                          There are no classes scheduled for this date. Please select another date or check back later.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
            
            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-6">
                {filteredClasses.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredClasses.map(renderClassCard)}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-xl font-medium mb-2">No Classes Found</h3>
                      <p className="text-gray-500 text-center max-w-md">
                        No classes match your current filters. Try adjusting your search criteria or check back later.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
        
        {/* Custom Booking Modal */}
        <ClassBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          selectedClass={selectedClass}
          onBookClass={handleBookClass}
        />
        
        {/* Custom Cancel Modal */}
        <ClassCancelModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          selectedClass={selectedClass}
          onCancelBooking={handleCancelBooking}
        />
      </div>
    </MainLayout>
  );
} 