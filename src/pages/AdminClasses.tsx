// Import the admin styles
import "../styles/Admin.css";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useClasses } from "../context/ClassContext";
import { Class, getClassBookings, ClassBooking, createClasses } from "../lib/classService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent} from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  Calendar as CalendarIcon,
  Edit,
  Trash,
  Plus,
  Search,
  Users
} from "lucide-react";
import { format, parseISO, isBefore, startOfDay, addYears, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, getDay } from "date-fns";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "../components/Layout/MainLayout";
import { DatePicker } from "../components/ui/date-picker";
import { TimePicker } from "../components/ui/time-picker";

export default function AdminClasses() {
  const { user, userRole } = useAuth();
  const { classes, isLoading, createClass, updateClass, deleteClass } = useClasses();
  const navigate = useNavigate();
  
  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  
  // State for class form
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  
  // State for selected date
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructor: "",
    date: "",
    time: "",
    duration: 60,
    capacity: 20,
    location: "",
    level: "all levels" as "beginner" | "intermediate" | "advanced" | "all levels",
    type: "yoga" as "yoga" | "cardio" | "strength" | "hiit" | "dance" | "pilates" | "cycling" | "other",
    image_url: "",
    day_of_week: null as number | null,
    recurring_type: "none" as "none" | "specific-day" | "all-days",
    month_count: 1
  });
  
  // Update formData when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd')
      }));
    }
  }, [selectedDate]);
  
  // Reset data and refresh on mount
  useEffect(() => {
    resetFormData();
    setSelectedDate(new Date());
    
    // Add this to force rerender of dropdowns
    const refreshTimer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    
    return () => clearTimeout(refreshTimer);
  }, []);
  
  // Check if user is admin
  if (!user || userRole !== "admin") {
    toast.error("You don't have permission to access this page");
    navigate("/dashboard");
    return null;
  }
  
  // Filter classes
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = 
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.location.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = filterType === "all" || cls.type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: "",
      description: "",
      instructor: "",
      date: "",
      time: "",
      duration: 60,
      capacity: 20,
      location: "",
      level: "all levels",
      type: "yoga",
      image_url: "",
      day_of_week: null,
      recurring_type: "none",
      month_count: 1
    });
    setSelectedClass(null);
  };
  
  // Handle edit class
  const handleEditClass = (cls: Class) => {
    setSelectedClass(cls);
    
    // Parse the date string to Date object for the date picker
    const classDate = cls.date ? parseISO(cls.date) : new Date();
    setSelectedDate(classDate);
    
    setFormData({
      name: cls.name,
      description: cls.description || "",
      instructor: cls.instructor,
      date: cls.date,
      time: cls.time,
      duration: cls.duration,
      capacity: cls.capacity,
      location: cls.location,
      level: cls.level,
      type: cls.type,
      image_url: cls.image_url || "",
      day_of_week: cls.day_of_week || null,
      recurring_type: cls.recurring_type || "none",
      month_count: cls.month_count || 1
    });
    setIsEditDialogOpen(true);
  };
  
  // Open delete dialog
  const handleDeleteClick = (cls: Class) => {
    setSelectedClass(cls);
    setIsDeleteDialogOpen(true);
  };
  
  // Generate recurring class dates
  const generateRecurringDates = (startDate: string, recurringType: 'none' | 'specific-day' | 'all-days', dayOfWeek: number | null, monthCount: number) => {
    try {
      const start = parseISO(startDate);
      const end = endOfMonth(addMonths(start, monthCount - 1));
      
      // For debugging
      console.log("Generating recurring dates with:", { 
        startDate, 
        recurringType, 
        dayOfWeek, 
        monthCount,
        startObj: start,
        endObj: end
      });
      
      if (recurringType === 'all-days') {
        // Get all days in the interval
        const allDates = eachDayOfInterval({ start, end }).map(date => format(date, 'yyyy-MM-dd'));
        console.log(`Generated ${allDates.length} dates for all-days`);
        return allDates;
      } else if (recurringType === 'specific-day' && dayOfWeek !== null) {
        // Get all days matching the specified day of week
        const daysOfWeek = eachDayOfInterval({ start, end })
          .filter(date => getDay(date) === dayOfWeek)
          .map(date => format(date, 'yyyy-MM-dd'));
        
        console.log(`Generated ${daysOfWeek.length} dates for specific-day (${dayOfWeek})`);
        return daysOfWeek;
      }
      
      // Default case - just return the original date
      console.log("Using default single date");
      return [startDate];
    } catch (error) {
      console.error("Error generating recurring dates:", error);
      // Return original date in case of error
      return [startDate];
    }
  };
  
  // Submit create class form
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Ensure we have the date from the selectedDate
      if (!selectedDate && formData.recurring_type !== "none") {
        toast.error("Please select a date first");
        return;
      }

      // Make sure form data date is updated from selectedDate
      const updatedFormData = {
        ...formData,
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : formData.date
      };
      
      // If recurring type is not none, create multiple classes with createClasses
      if (updatedFormData.recurring_type !== "none") {
        // For specific-day type, if day_of_week is not set, use the selected date's day
        if (updatedFormData.recurring_type === "specific-day" && updatedFormData.day_of_week === null && selectedDate) {
          updatedFormData.day_of_week = getDay(selectedDate);
        }
        
        // Generate dates based on the recurring type
        const dates = generateRecurringDates(
          updatedFormData.date,
          updatedFormData.recurring_type,
          updatedFormData.day_of_week,
          updatedFormData.month_count
        );
        
        if (dates.length === 0) {
          toast.error("No valid dates were generated for the recurring class");
          return;
        }
        
        // Create a class object for each date
        const classesData = dates.map(date => ({
          ...updatedFormData,
          date,
          created_by: user?.id || ""
        }));
        
        console.log("Creating recurring classes with data:", classesData);
        
        // Use createClasses to create all classes at once
        await createClasses(classesData);
        toast.success(`${dates.length} recurring classes created successfully`);
      } else {
        // Create a single class
        await createClass({
          ...updatedFormData,
          created_by: user?.id || ""
        });
        toast.success("Class created successfully");
      }
      
      setIsCreateDialogOpen(false);
      resetFormData();
    } catch (error: any) {
      console.error("Error creating class:", error);
      toast.error(error.message || "Failed to create class");
    }
  };
  
  // Submit edit class form
  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClass) return;
    
    try {
      // Ensure we have the date from the selectedDate
      if (!selectedDate && formData.recurring_type !== "none") {
        toast.error("Please select a date first");
        return;
      }

      // Make sure form data date is updated from selectedDate
      const updatedFormData = {
        ...formData,
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : formData.date
      };
      
      // Check if we're changing from single to recurring or vice versa
      if (selectedClass.recurring_type !== updatedFormData.recurring_type) {
        // If changing to recurring
        if (updatedFormData.recurring_type !== "none") {
          // For specific-day type, if day_of_week is not set, use the selected date's day
          if (updatedFormData.recurring_type === "specific-day" && updatedFormData.day_of_week === null && selectedDate) {
            updatedFormData.day_of_week = getDay(selectedDate);
          }
          
          // Delete the original class and create new recurring ones
          await deleteClass(selectedClass.id);
          
          // Generate dates based on the recurring type
          const dates = generateRecurringDates(
            updatedFormData.date,
            updatedFormData.recurring_type,
            updatedFormData.day_of_week,
            updatedFormData.month_count
          );
          
          if (dates.length === 0) {
            toast.error("No valid dates were generated for the recurring class");
            return;
          }
          
          // Create a class object for each date
          const classesData = dates.map(date => ({
            ...updatedFormData,
            date,
            created_by: user?.id || ""
          }));
          
          console.log("Creating recurring classes after edit with data:", classesData);
          
          await createClasses(classesData);
          toast.success(`Updated to recurring class with ${dates.length} classes`);
        } else {
          // Changing from recurring to single
          await updateClass(selectedClass.id, updatedFormData);
          toast.success("Class updated to single class successfully");
        }
      } else if (updatedFormData.recurring_type !== "none" && 
                (selectedClass.month_count !== updatedFormData.month_count || 
                 selectedClass.day_of_week !== updatedFormData.day_of_week)) {
        // For specific-day type, if day_of_week is not set, use the selected date's day
        if (updatedFormData.recurring_type === "specific-day" && updatedFormData.day_of_week === null && selectedDate) {
          updatedFormData.day_of_week = getDay(selectedDate);
        }
        
        // Changing recurring settings, recreate the series
        await deleteClass(selectedClass.id);
        
        // Generate dates based on the recurring type
        const dates = generateRecurringDates(
          updatedFormData.date,
          updatedFormData.recurring_type,
          updatedFormData.day_of_week,
          updatedFormData.month_count
        );
        
        if (dates.length === 0) {
          toast.error("No valid dates were generated for the recurring class");
          return;
        }
        
        // Create a class object for each date
        const classesData = dates.map(date => ({
          ...updatedFormData,
          date,
          created_by: user?.id || ""
        }));
        
        console.log("Updating recurring settings with data:", classesData);
        
        await createClasses(classesData);
        toast.success(`Updated recurring settings, created ${dates.length} classes`);
      } else {
        // No change in recurring type or settings
        await updateClass(selectedClass.id, updatedFormData);
        toast.success("Class updated successfully");
      }
      
      setIsEditDialogOpen(false);
      resetFormData();
    } catch (error: any) {
      console.error("Error updating class:", error);
      toast.error(error.message || "Failed to update class");
    }
  };
  
  // Confirm delete class
  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    
    try {
      await deleteClass(selectedClass.id);
      
      toast.success("Class deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedClass(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete class");
    }
  };

  return (
    <MainLayout>
    <div className="container px-4 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Manage Classes</h1>
        
        <Button onClick={() => {
          resetFormData();
          setIsCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Class
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
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
      </div>
      
      {/* Classes Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3">Loading classes...</span>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatDate(cls.date)}</span>
                          <span className="text-gray-500 text-sm">{cls.time} ({cls.duration} mins)</span>
                        </div>
                      </TableCell>
                      <TableCell>{cls.location}</TableCell>
                      <TableCell>{cls.instructor}</TableCell>
                      <TableCell>
                        <Badge className="capitalize">{cls.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-500 mr-2" />
                          <span>{cls.capacity}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const bookedSpots = cls.capacity - (cls.available_spots ?? 0);
                          return (
                            <Badge variant={
                              bookedSpots === cls.capacity ? "destructive" : 
                              bookedSpots > cls.capacity * 0.7 ? "secondary" : 
                              "outline"
                            }>
                              {bookedSpots} / {cls.capacity}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClass(cls)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 border-red-200 hover:text-red-600 hover:bg-red-50 hover:border-red-300"
                            onClick={() => handleDeleteClick(cls)}
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                      No classes found. Create a new class to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* Create Class Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>
              Add a new fitness class to the schedule.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto pr-2 my-4">
            <div className="grid gap-4">
              {/* Class Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter class name"
                />
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the class"
                  rows={3}
                />
              </div>
              
              {/* Instructor */}
              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                  id="instructor"
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleInputChange}
                  placeholder="Instructor name"
                />
              </div>
              
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Class location"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <DatePicker
                    date={selectedDate}
                    setDate={setSelectedDate}
                    placeholder="Select date"
                    fromDate={new Date()}
                    toDate={addYears(new Date(), 1)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <TimePicker
                    time={formData.time}
                    setTime={(time) => setFormData({ ...formData, time })}
                    placeholder="Select time"
                  />
                </div>
              </div>
              
              {/* Duration & Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="15"
                    max="240"
                    value={formData.duration}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.capacity}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              {/* Class Type & Level */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Class Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "yoga" | "cardio" | "strength" | "hiit" | "dance" | "pilates" | "cycling" | "other") => 
                      setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="level">Experience Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value: "beginner" | "intermediate" | "advanced" | "all levels") => 
                      setFormData(prev => ({ ...prev, level: value }))}
                  >
                    <SelectTrigger id="level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="all levels">All Levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Recurring Options */}
              <div className="space-y-2">
                <Label htmlFor="recurring_type">Schedule Type</Label>
                <Select
                  value={formData.recurring_type}
                  onValueChange={(value: "none" | "specific-day" | "all-days") => 
                    setFormData(prev => ({ ...prev, recurring_type: value }))}
                >
                  <SelectTrigger id="recurring_type">
                    <SelectValue placeholder="Select recurring type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Single Class</SelectItem>
                    <SelectItem value="specific-day">Specific Day Each Week</SelectItem>
                    <SelectItem value="all-days">All Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.recurring_type !== "none" && (
                <div className="grid grid-cols-2 gap-4">
                  {formData.recurring_type === "specific-day" && (
                    <div className="space-y-2">
                      <Label htmlFor="day_of_week">Day of Week</Label>
                      <Select
                        value={formData.day_of_week?.toString() || ""}
                        onValueChange={(value: string) => 
                          setFormData(prev => ({ ...prev, day_of_week: parseInt(value) }))}
                      >
                        <SelectTrigger id="day_of_week">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="month_count">Duration (months)</Label>
                    <Select
                      value={formData.month_count.toString()}
                      onValueChange={(value: string) => 
                        setFormData(prev => ({ ...prev, month_count: parseInt(value) }))}
                    >
                      <SelectTrigger id="month_count">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Month</SelectItem>
                        <SelectItem value="2">2 Months</SelectItem>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">1 Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL (optional)</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateClass}
            >
              Create Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update the details for this class.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto pr-2 my-4">
            <div className="grid gap-4">
              {/* Class Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Class Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter class name"
                />
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the class"
                  rows={3}
                />
              </div>
              
              {/* Instructor */}
              <div className="space-y-2">
                <Label htmlFor="edit-instructor">Instructor</Label>
                <Input
                  id="edit-instructor"
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleInputChange}
                  placeholder="Instructor name"
                />
              </div>
              
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Class location"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <DatePicker
                    date={selectedDate}
                    setDate={setSelectedDate}
                    placeholder="Select date"
                    fromDate={new Date()}
                    toDate={addYears(new Date(), 1)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-time">Time</Label>
                  <TimePicker
                    time={formData.time}
                    setTime={(time) => setFormData({ ...formData, time })}
                    placeholder="Select time"
                  />
                </div>
              </div>
              
              {/* Duration & Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duration (minutes)</Label>
                  <Input
                    id="edit-duration"
                    name="duration"
                    type="number"
                    min="15"
                    max="240"
                    value={formData.duration}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-capacity">Capacity</Label>
                  <Input
                    id="edit-capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.capacity}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              {/* Class Type & Level */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Class Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "yoga" | "cardio" | "strength" | "hiit" | "dance" | "pilates" | "cycling" | "other") => 
                      setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger id="edit-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-level">Experience Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value: "beginner" | "intermediate" | "advanced" | "all levels") => 
                      setFormData(prev => ({ ...prev, level: value }))}
                  >
                    <SelectTrigger id="edit-level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="all levels">All Levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Recurring Options */}
              <div className="space-y-2">
                <Label htmlFor="edit-recurring_type">Schedule Type</Label>
                <Select
                  value={formData.recurring_type}
                  onValueChange={(value: "none" | "specific-day" | "all-days") => 
                    setFormData(prev => ({ ...prev, recurring_type: value }))}
                >
                  <SelectTrigger id="edit-recurring_type">
                    <SelectValue placeholder="Select recurring type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Single Class</SelectItem>
                    <SelectItem value="specific-day">Specific Day Each Week</SelectItem>
                    <SelectItem value="all-days">All Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.recurring_type !== "none" && (
                <div className="grid grid-cols-2 gap-4">
                  {formData.recurring_type === "specific-day" && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-day_of_week">Day of Week</Label>
                      <Select
                        value={formData.day_of_week?.toString() || ""}
                        onValueChange={(value: string) => 
                          setFormData(prev => ({ ...prev, day_of_week: parseInt(value) }))}
                      >
                        <SelectTrigger id="edit-day_of_week">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-month_count">Duration (months)</Label>
                    <Select
                      value={formData.month_count.toString()}
                      onValueChange={(value: string) => 
                        setFormData(prev => ({ ...prev, month_count: parseInt(value) }))}
                    >
                      <SelectTrigger id="edit-month_count">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Month</SelectItem>
                        <SelectItem value="2">2 Months</SelectItem>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">1 Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="edit-image_url">Image URL (optional)</Label>
                <Input
                  id="edit-image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateClass}
            >
              Update Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this class? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedClass && (
            <div className="py-4">
              <h3 className="font-medium">{selectedClass.name}</h3>
              <div className="text-sm text-gray-500 mt-1 flex items-center">
                <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                {formatDate(selectedClass.date)} at {selectedClass.time}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteClass}
            >
              Delete Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </MainLayout>
  );
} 