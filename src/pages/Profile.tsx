import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { uploadProfileImage, getInitials } from '../lib/profileService';
import { useAuth } from '../context/AuthContext';
import { useXp } from '../context/XpContext';
import toast from 'react-hot-toast';
import { 
  Camera, 
  User, 
  Phone, 
  MapPin, 
  Globe, 
  Calendar, 
  CheckCircle, 
  Loader2,
  Mail,
  Award,
  Shield,
  Trophy,
  Clock,
  ChevronLeft,
  LogOut
} from 'lucide-react';

export default function Profile() {
  const { user, updateProfile, userRole, signOut } = useAuth();
  const { userXp, userLevel } = useXp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profileImage: user?.profileImage || ''
  });
  
  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        profileImage: user.profileImage || ''
      });
      console.log('user',user);
    }
  }, [user]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check if there are any changes
    const hasChanges = 
      formData.name !== user?.name || 
      imagePreview !== null; // If imagePreview exists, an image was uploaded
    
    if (!hasChanges) {
      toast('No changes to save', {
        icon: 'ℹ️',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update profile in the database
      await updateProfile({
        name: formData.name,
        profileImage: formData.profileImage
      });
      
      // If we had a preview URL, clean it up
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
      
      // Switch to info tab after successful update
      setActiveTab('info');
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Handle file selection for profile image
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset error state
    setUploadError(null);
    setIsLoading(true);
    
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please use JPEG, PNG, GIF, or WebP.');
      toast.error('Invalid file type. Please use JPEG, PNG, GIF, or WebP.');
      setIsLoading(false);
      return;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File is too large. Maximum size is 5MB.');
      toast.error('File is too large. Maximum size is 5MB.');
      setIsLoading(false);
      return;
    }
    
    // Create a preview
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    try {
      // Show uploading toast
      const uploadToast = toast.loading('Uploading image...');
      
      // Upload the image to storage
      const imageUrl = await uploadProfileImage(file, user?.id || '');
      
      // Update form data with the actual image URL (not the preview)
      setFormData(prev => ({ ...prev, profileImage: imageUrl }));
      
      // Dismiss loading toast and show success
      toast.dismiss(uploadToast);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      setUploadError(error.message || 'Failed to upload image. Please try again.');
      toast.error(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };
  
  return (
    <MainLayout>
      <div className="max-w-full md:max-w-[calc(100vw-280px)]">
        {/* Mobile header with back button */}
        <div className="md:hidden flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <button 
            onClick={() => navigate('/home')}
            className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
        
        {/* Desktop header - hidden on mobile */}
        <div className="hidden md:flex items-center gap-4 px-6 py-6">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center shadow-sm">
            <User className="h-7 w-7 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <TabsList className="w-full rounded-none bg-transparent p-0 h-12 md:h-14 overflow-x-auto flex-nowrap">
              <TabsTrigger 
                value="info"
                className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 data-[state=active]:shadow-none h-12 md:h-14 flex-shrink-0"
              >
                Personal Info
              </TabsTrigger>
              <TabsTrigger 
                value="edit"
                className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 data-[state=active]:shadow-none h-12 md:h-14 flex-shrink-0"
              >
                Edit Profile
              </TabsTrigger>
              <TabsTrigger 
                value="security"
                className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 data-[state=active]:shadow-none h-12 md:h-14 flex-shrink-0"
              >
                Security
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="info" className="p-4 md:p-6 space-y-6">
            {/* Profile Summary Card - Mobile version */}
            <Card className="md:hidden">
              <CardContent className="pt-6 pb-4">
                <div className="flex flex-col items-center text-center">
                  <div className="h-20 w-20 rounded-full border-4 border-white dark:border-gray-800 shadow-md overflow-hidden relative bg-white dark:bg-gray-800 mb-3">
                    {formData.profileImage ? (
                      <img 
                        src={formData.profileImage} 
                        alt={formData.name} 
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          console.error("Failed to load profile image:", e);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary-50 dark:bg-primary-900/10 text-xl font-semibold">
                        {getInitials(formData.name || user?.email?.split('@')[0] || '?')}
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-lg font-bold">{formData.name || user?.email?.split('@')[0]}</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{user?.email}</p>
                  
                  <div className="flex items-center mt-3 space-x-2">
                    <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                      {user?.membershipType || 'Elite'}
                    </span>
                    <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
                      Level {userLevel}
                    </span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="mt-4 w-full"
                    onClick={() => setActiveTab("edit")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Card - Desktop version (hidden on mobile) */}
              <div className="hidden md:block md:col-span-1 space-y-6">
                <Card className="overflow-hidden border-2 border-gray-100 dark:border-gray-800">
                  <div className="bg-gradient-to-b from-primary-50 to-transparent dark:from-primary-900/10 dark:to-transparent h-24"></div>
                  <CardContent className="-mt-12 flex flex-col items-center pt-0 pb-6">
                    <div className="mb-4">
                      <div className="h-24 w-24 rounded-full border-4 border-white dark:border-gray-800 shadow-md overflow-hidden relative bg-white dark:bg-gray-800">
                        {formData.profileImage ? (
                          <img 
                            src={formData.profileImage} 
                            alt={formData.name} 
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              console.error("Failed to load profile image:", e);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-primary-50 dark:bg-primary-900/10 text-2xl font-semibold">
                            {getInitials(formData.name || user?.email?.split('@')[0] || '?')}
                          </div>
                        )}
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-center">{formData.name || user?.email?.split('@')[0]}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-center mt-1">{user?.email}</p>
                    
                    <div className="w-full mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium">Membership</span>
                        <span className="text-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                          {user?.membershipType || 'Elite'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Level</span>
                        <span className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
                          Level {userLevel}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-6 w-full">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab("edit")}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Stats Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mr-3">
                          <Trophy className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Experience</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{userXp} XP total</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mr-3">
                          <Award className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Achievements</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">3 badges earned</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-3">
                          <Clock className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Workout Time</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">24 hours total</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Personal Information Card */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription className="hidden md:block">Your personal details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Mobile Stats Row - only shown on mobile */}
                  <div className="grid grid-cols-3 gap-2 md:hidden mb-2">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                      <div className="text-amber-500 font-semibold">{userXp}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">XP</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                      <div className="text-green-500 font-semibold">3</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Badges</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                      <div className="text-blue-500 font-semibold">24h</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Workout</div>
                    </div>
                  </div>
                  
                  {/* Info Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name</h3>
                        <p className="font-medium">{formData.name || user?.email?.split('@')[0] || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email Address</h3>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{user?.email}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Account Type</h3>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{userRole === 'admin' ? 'Administrator' : 'Standard User'}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Membership</h3>
                        <p className="text-sm font-medium">{user?.membershipType || 'Elite'} <span className="text-green-500 ml-1">●</span></p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">About</h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Tell us about yourself on the edit page!</p>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      onClick={() => setActiveTab('edit')} 
                      className="w-full md:w-auto"
                    >
                      Edit Profile Information
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="edit" className="p-4 md:p-6 space-y-6">
            {/* Photo upload card - Mobile version */}
            <Card className="md:hidden">
              <CardHeader className="pb-3">
                <CardTitle>Profile Photo</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pb-6">
                <div className="relative cursor-pointer mb-3" onClick={triggerFileInput}>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  
                  <div className="h-24 w-24 mx-auto rounded-full border-4 border-primary-50 dark:border-primary-900/20 overflow-hidden group relative shadow-md">
                    {imagePreview || formData.profileImage ? (
                      <>
                        <img 
                          src={imagePreview || formData.profileImage} 
                          alt={formData.name} 
                          className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                          onError={(e) => {
                            console.error("Failed to load profile image:", e);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                          <Camera className="h-8 w-8 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary-50 dark:bg-primary-900/10 text-2xl font-semibold group-hover:bg-primary-100 dark:group-hover:bg-primary-900/20 transition-colors">
                        {getInitials(formData.name)}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Camera edit icon */}
                  <div className="absolute bottom-0 right-0 bg-primary-600 dark:bg-primary-500 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">
                    <Camera className="h-4 w-4" />
                  </div>
                </div>
                
                {uploadError && (
                  <div className="mt-2 text-xs text-red-500 text-center">
                    {uploadError}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Photo Card - Desktop version */}
              <Card className="md:col-span-1 h-min hidden md:block">
                <CardHeader>
                  <CardTitle>Profile Photo</CardTitle>
                  <CardDescription>Update your profile picture</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="relative cursor-pointer mb-4" onClick={triggerFileInput}>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    
                    <div className="h-36 w-36 mx-auto rounded-full border-4 border-primary-50 dark:border-primary-900/20 overflow-hidden group relative shadow-md">
                      {imagePreview || formData.profileImage ? (
                        <>
                          <img 
                            src={imagePreview || formData.profileImage} 
                            alt={formData.name} 
                            className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                            onError={(e) => {
                              console.error("Failed to load profile image:", e);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                            <Camera className="h-10 w-10 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary-50 dark:bg-primary-900/10 text-3xl font-semibold group-hover:bg-primary-100 dark:group-hover:bg-primary-900/20 transition-colors">
                          {getInitials(formData.name)}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="h-10 w-10 text-primary-600 dark:text-primary-400" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Camera edit icon */}
                    <div className="absolute bottom-1 right-1 bg-primary-600 dark:bg-primary-500 text-white p-2.5 rounded-full cursor-pointer shadow-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors">
                      <Camera className="h-5 w-5" />
                    </div>
                  </div>
                  
                  {uploadError && (
                    <div className="mt-2 text-sm text-red-500 text-center">
                      {uploadError}
                    </div>
                  )}
                  
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                    <p>Click to upload a new photo</p>
                    <p className="mt-1">JPG, PNG, GIF or WebP, max 5MB</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Personal Information Form */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription className="hidden md:block">Update your personal details and contact information</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form onSubmit={handleSubmit}>
                    <div className="space-y-4 md:space-y-5">
                      <FormItem>
                        <FormLabel required>Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            placeholder="Enter your full name" 
                            required
                          />
                        </FormControl>
                      </FormItem>
                      
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            name="email" 
                            value={user?.email || ''} 
                            disabled 
                            readOnly
                          />
                        </FormControl>
                        <FormDescription>
                          <span className="text-xs">Your email address cannot be changed.</span>
                        </FormDescription>
                      </FormItem>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setActiveTab('info')}
                          className="flex-1 md:flex-none"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isLoading}
                          className="flex-1 md:flex-none md:min-w-[120px]"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="security" className="p-4 md:p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription className="hidden md:block">Manage your password and account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 md:p-5 border border-gray-100 dark:border-gray-700">
                  <div className="flex gap-4 items-start">
                    <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-medium mb-1">Change Password</h3>
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-3 md:mb-4">
                        To update your password, please use the password reset functionality.
                      </p>
                      <Button 
                        onClick={() => navigate('/reset-password')}
                        className="w-full md:w-auto"
                      >
                        Reset Password
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 md:p-5 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-base md:text-lg font-medium mb-3">Account Security Tips</h3>
                  <ul className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Use a strong, unique password</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Enable two-factor authentication when available</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Never share your login credentials</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>Update your password regularly</span>
                    </li>
                  </ul>
                </div>
                
                {/* Mobile-specific security card */}
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-100 dark:border-amber-900/20 md:hidden">
                  <h3 className="text-base font-medium text-amber-800 dark:text-amber-400 mb-2">Mobile Device Security</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                    Keep your mobile device secure to protect your fitness data:
                  </p>
                  <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>Keep your device's operating system updated</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>Lock your device with a strong passcode or biometric security</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>Only download apps from official app stores</span>
                    </li>
                  </ul>
                </div>
                
                {/* Logout Button */}
                <div className="mt-6">
                  <Button 
                    variant="destructive" 
                    className="w-full flex items-center justify-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Mobile bottom padding to ensure content isn't hidden by the bottom nav */}
        <div className="h-16 md:h-0"></div>
      </div>
    </MainLayout>
  );
} 