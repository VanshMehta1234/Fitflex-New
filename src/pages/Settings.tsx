import React, { useState } from 'react';
import { StandardPage } from '../components/StandardPage';
import { SectionHeader, StandardCard, Button } from '../components/ui';
import { ThemeToggle } from '../components';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Lock, 
  Globe, 
  Zap, 
  Eye, 
  HelpCircle,
  CheckCircle,
  Phone,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Input } from '../components/ui/input';
import { Avatar } from '../components/ui/avatar';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  
  // Appearance settings
  const [fontSize, setFontSize] = useState('medium');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [highContrastMode, setHighContrastMode] = useState(false);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [activityTracking, setActivityTracking] = useState(true);
  
  // Accessibility settings
  const [screenReaderOptimized, setScreenReaderOptimized] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // Handle settings changes
  const handleSettingChange = (setting: string, value: any) => {
    // In a real app, you would save these settings to a backend
    switch (setting) {
      case 'theme':
        setTheme(value);
        break;
      case 'fontSize':
        setFontSize(value);
        document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
        document.documentElement.classList.add(`text-${value === 'small' ? 'sm' : value === 'large' ? 'lg' : 'base'}`);
        break;
      case 'animations':
        setAnimationsEnabled(value);
        break;
      case 'highContrast':
        setHighContrastMode(value);
        document.documentElement.classList.toggle('high-contrast', value);
        break;
      case 'emailNotifications':
        setEmailNotifications(value);
        break;
      case 'pushNotifications':
        setPushNotifications(value);
        break;
      case 'marketingEmails':
        setMarketingEmails(value);
        break;
      case 'profileVisibility':
        setProfileVisibility(value);
        break;
      case 'activityTracking':
        setActivityTracking(value);
        break;
      case 'screenReader':
        setScreenReaderOptimized(value);
        break;
      case 'reducedMotion':
        setReducedMotion(value);
        document.documentElement.classList.toggle('reduce-motion', value);
        break;
    }
    
    toast.success('Setting updated successfully');
  };
  
  return (
    <StandardPage
      title="Settings"
      description="Customize your FitFlex experience"
      icon={SettingsIcon}
    >
      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar with setting categories */}
        <div className="md:col-span-1">
          <StandardCard>
            <nav className="space-y-1">
              <a href="#appearance" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground">
                <Eye className="mr-3 h-5 w-5" />
                Appearance
              </a>
              <a href="#account" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-muted">
                <User className="mr-3 h-5 w-5 opacity-70" />
                Account
              </a>
              <a href="#notifications" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-muted">
                <Bell className="mr-3 h-5 w-5 opacity-70" />
                Notifications
              </a>
              <a href="#privacy" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-muted">
                <Lock className="mr-3 h-5 w-5 opacity-70" />
                Privacy & Security
              </a>
              <a href="#accessibility" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-muted">
                <HelpCircle className="mr-3 h-5 w-5 opacity-70" />
                Accessibility
              </a>
              <a href="#advanced" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-muted">
                <Zap className="mr-3 h-5 w-5 opacity-70" />
                Advanced
              </a>
            </nav>
          </StandardCard>
        </div>
        
        {/* Main settings content */}
        <div className="md:col-span-2 space-y-6">
          {/* Appearance Settings */}
          <div id="appearance">
            <StandardCard className="mb-6">
              <SectionHeader
                title="Appearance"
                description="Customize how FitFlex looks"
                icon={Eye}
              />
              
              <div className="mt-6 space-y-6">
                {/* Theme Selection */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Theme</Label>
                  <div className="grid grid-cols-3 gap-4 pt-1">
                    <div 
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${theme === 'light' ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/50'}`}
                      onClick={() => handleSettingChange('theme', 'light')}
                    >
                      <Sun className="h-10 w-10 mb-2 text-amber-500" />
                      <span>Light</span>
                    </div>
                    
                    <div 
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${theme === 'dark' ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/50'}`}
                      onClick={() => handleSettingChange('theme', 'dark')}
                    >
                      <Moon className="h-10 w-10 mb-2 text-indigo-400" />
                      <span>Dark</span>
                    </div>
                    
                    <div 
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all border-input hover:border-primary/50`}
                      onClick={() => handleSettingChange('theme', 'system')}
                    >
                      <div className="h-10 w-10 mb-2 flex">
                        <div className="w-1/2 flex items-center justify-center bg-amber-500 rounded-l-full">
                          <Sun className="h-5 w-5 text-white" />
                        </div>
                        <div className="w-1/2 flex items-center justify-center bg-indigo-700 rounded-r-full">
                          <Moon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <span>System</span>
                    </div>
                  </div>
                </div>
                
                {/* Font Size */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Font Size</Label>
                  <RadioGroup 
                    value={fontSize}
                    onValueChange={(value:any) => handleSettingChange('fontSize', value)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="small" id="small" />
                      <Label htmlFor="small">Small</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="large" id="large" />
                      <Label htmlFor="large">Large</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {/* Animations */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Animations</Label>
                    <p className="text-sm text-muted-foreground">Show animations throughout the app</p>
                  </div>
                  <Switch 
                    checked={animationsEnabled} 
                    onCheckedChange={(value) => handleSettingChange('animations', value)} 
                  />
                </div>
                
                {/* High Contrast */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">High Contrast Mode</Label>
                    <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                  </div>
                  <Switch 
                    checked={highContrastMode} 
                    onCheckedChange={(value) => handleSettingChange('highContrast', value)} 
                  />
                </div>
              </div>
            </StandardCard>
          </div>
          
          {/* Account Settings */}
          <div id="account">
            <StandardCard className="mb-6">
              <SectionHeader
                title="Account"
                description="Manage your account information"
                icon={User}
              />
              
              <div className="mt-6 space-y-6">
                {/* Profile Information */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="relative">
                    <Avatar 
                      src={user?.profileImage}
                      alt={user?.name || "User"}
                      className="h-20 w-20 border-2 border-primary"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 rounded-full p-1 h-8 w-8"
                    >
                      <span className="sr-only">Change avatar</span>
                      <span className="text-xl">+</span>
                    </Button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue={user?.name || ""} placeholder="Your name" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" defaultValue={user?.email || ""} placeholder="Your email" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" placeholder="Your phone number" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="birthdate">Date of Birth</Label>
                        <Input id="birthdate" type="date" />
                      </div>
                    </div>
                    
                    <Button className="mt-2">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </StandardCard>
          </div>
          
          {/* Notification Settings */}
          <div id="notifications">
            <StandardCard className="mb-6">
              <SectionHeader
                title="Notifications"
                description="Manage how and when you receive alerts"
                icon={Bell}
              />
              
              <div className="mt-6 space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive important updates via email</p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={(value) => handleSettingChange('emailNotifications', value)} 
                  />
                </div>
                
                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get real-time alerts on your device</p>
                  </div>
                  <Switch 
                    checked={pushNotifications} 
                    onCheckedChange={(value) => handleSettingChange('pushNotifications', value)} 
                  />
                </div>
                
                {/* Marketing Emails */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">Receive promotional offers and news</p>
                  </div>
                  <Switch 
                    checked={marketingEmails} 
                    onCheckedChange={(value) => handleSettingChange('marketingEmails', value)} 
                  />
                </div>
              </div>
            </StandardCard>
          </div>
          
          {/* Privacy & Security */}
          <div id="privacy">
            <StandardCard className="mb-6">
              <SectionHeader
                title="Privacy & Security"
                description="Manage your data and security settings"
                icon={Lock}
              />
              
              <div className="mt-6 space-y-6">
                {/* Profile Visibility */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Profile Visibility</Label>
                  <RadioGroup 
                    value={profileVisibility}
                    onValueChange={(value:any) => handleSettingChange('profileVisibility', value)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public">Public - Anyone can view your profile</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="members" id="members" />
                      <Label htmlFor="members">Members Only - Only FitFlex members can view</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private">Private - Only you can view your profile</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {/* Activity Tracking */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Activity Tracking</Label>
                    <p className="text-sm text-muted-foreground">Allow tracking of workout and progress data</p>
                  </div>
                  <Switch 
                    checked={activityTracking} 
                    onCheckedChange={(value) => handleSettingChange('activityTracking', value)} 
                  />
                </div>
                
                {/* Security Options */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Security Options</Label>
                  <div className="rounded-lg border border-input bg-background p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Change Password</span>
                      <Button size="sm" variant="outline">Update</Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-input bg-background p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Two-Factor Authentication</span>
                      <Button size="sm" variant="outline">Enable</Button>
                    </div>
                  </div>
                </div>
              </div>
            </StandardCard>
          </div>
          
          {/* Accessibility */}
          <div id="accessibility">
            <StandardCard className="mb-6">
              <SectionHeader
                title="Accessibility"
                description="Make FitFlex more accessible for all users"
                icon={HelpCircle}
              />
              
              <div className="mt-6 space-y-6">
                {/* Screen Reader Support */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Screen Reader Optimized</Label>
                    <p className="text-sm text-muted-foreground">Enhance compatibility with screen readers</p>
                  </div>
                  <Switch 
                    checked={screenReaderOptimized} 
                    onCheckedChange={(value) => handleSettingChange('screenReader', value)} 
                  />
                </div>
                
                {/* Reduced Motion */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Reduced Motion</Label>
                    <p className="text-sm text-muted-foreground">Minimize animations and motion effects</p>
                  </div>
                  <Switch 
                    checked={reducedMotion} 
                    onCheckedChange={(value) => handleSettingChange('reducedMotion', value)} 
                  />
                </div>
              </div>
            </StandardCard>
          </div>
          
          {/* Advanced Settings */}
          <div id="advanced">
            <StandardCard className="mb-6">
              <SectionHeader
                title="Advanced"
                description="Advanced settings for power users"
                icon={Zap}
              />
              
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <h3 className="text-base font-medium mb-2 text-destructive">Danger Zone</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Clear App Data</p>
                        <p className="text-sm text-muted-foreground">Reset all app settings and cache</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                        Clear Data
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Delete Account</p>
                        <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
                      </div>
                      <Button size="sm" variant="destructive">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </StandardCard>
          </div>
        </div>
      </div>
    </StandardPage>
  );
};

export default Settings; 