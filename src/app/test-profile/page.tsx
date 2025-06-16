'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, Camera } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PerformanceMonitor } from '@/components/ui/performance-monitor';

// Performance monitoring
const startTime = performance.now();
console.log('Profile page component started rendering at:', startTime);

// Mock user data
const mockUser = {
  id: '123456',
  email: 'test@example.com',
  user_metadata: {
    first_name: 'John',
    last_name: 'Doe',
    phone: '+1234567890',
    company: 'Acme Inc.',
    job_title: 'Project Manager',
    avatar_url: null as string | null,
    notifications: {
      email: true,
      projects: true,
      tasks: true,
      security: true,
      marketing: false
    }
  }
};

const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  projectUpdates: z.boolean().default(true),
  taskAssignments: z.boolean().default(true),
  securityAlerts: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function TestProfilePage() {
  console.log('Profile page function execution started at:', performance.now() - startTime, 'ms');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const { toast } = useToast();
  const [user, setUser] = useState(mockUser);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.user_metadata?.first_name || '',
      lastName: user?.user_metadata?.last_name || '',
      email: user?.email || '',
      phone: user?.user_metadata?.phone || '',
      company: user?.user_metadata?.company || '',
      jobTitle: user?.user_metadata?.job_title || '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: user?.user_metadata?.notifications?.email ?? true,
      projectUpdates: user?.user_metadata?.notifications?.projects ?? true,
      taskAssignments: user?.user_metadata?.notifications?.tasks ?? true,
      securityAlerts: user?.user_metadata?.notifications?.security ?? true,
      marketingEmails: user?.user_metadata?.notifications?.marketing ?? false,
    },
  });

  // Update profile form values when user data is loaded
  useEffect(() => {
    if (user && !profileForm.formState.isDirty) {
      profileForm.reset({
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        company: user.user_metadata?.company || '',
        jobTitle: user.user_metadata?.job_title || '',
      });

      // Set avatar URL if available
      setAvatarUrl(user.user_metadata?.avatar_url || null);

      // Set notification preferences
      notificationForm.reset({
        emailNotifications: user.user_metadata?.notifications?.email ?? true,
        projectUpdates: user.user_metadata?.notifications?.projects ?? true,
        taskAssignments: user.user_metadata?.notifications?.tasks ?? true,
        securityAlerts: user.user_metadata?.notifications?.security ?? true,
        marketingEmails: user.user_metadata?.notifications?.marketing ?? false,
      });
    }
  }, [user, profileForm, notificationForm]);

  async function onProfileSubmit(data: ProfileFormValues) {
    try {
      setIsUpdating(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update mock user data
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone || '',
          company: data.company || '',
          job_title: data.jobTitle || '',
        }
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    try {
      setIsUpdating(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate password verification
      if (data.currentPassword !== 'password123') {
        throw new Error("Current password is incorrect");
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function onNotificationSubmit(data: NotificationFormValues) {
    try {
      setIsUpdating(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update mock user data
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          notifications: {
            email: data.emailNotifications,
            projects: data.projectUpdates,
            tasks: data.taskAssignments,
            security: data.securityAlerts,
            marketing: data.marketingEmails,
          }
        }
      });
      
      toast({
        title: "Notification preferences updated",
        description: "Your notification preferences have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating notification preferences",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setIsUploading(true);
      setUploadError(null);
      
      const file = event.target.files?.[0];
      if (!file) return;
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please upload an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image size should be less than 5MB');
        return;
      }
      
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a fake URL for the uploaded image
      const fakeUrl = URL.createObjectURL(file);
      
      // Update mock user data
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          avatar_url: fakeUrl as string | null
        }
      });
      
      // Update local state
      setAvatarUrl(fakeUrl);
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setUploadError(error.message || 'Failed to upload avatar');
      toast({
        title: "Error updating avatar",
        description: error.message || 'Failed to upload avatar',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }

  const initials = `${profileForm.getValues().firstName.charAt(0) || ''}${profileForm.getValues().lastName.charAt(0) || ''}`;

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Test Profile Page</h1>
      
      <PerformanceMonitor 
        componentName="TestProfilePage" 
        startTime={startTime} 
        showByDefault={true}
      />
      
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl || user.user_metadata?.avatar_url || ''} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <label 
              htmlFor="avatar-upload" 
              className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </label>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
        
        {uploadError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} disabled />
                          </FormControl>
                          <FormDescription>
                            Your email address is your unique identifier and cannot be changed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isUpdating || !profileForm.formState.isDirty}
                      >
                        {isUpdating ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="password" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to maintain account security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            For testing, use "password123" as the current password
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 8 characters and include uppercase, lowercase, and numbers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isUpdating || !passwordForm.formState.isDirty}
                      >
                        {isUpdating ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="emailNotifications">Email Notifications</Label>
                              <FormDescription>
                                Receive notifications via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="emailNotifications"
                              />
                            </FormControl>
                          </div>
                        )}
                      />
                      
                      <Separator />
                      
                      <FormField
                        control={notificationForm.control}
                        name="projectUpdates"
                        render={({ field }) => (
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="projectUpdates">Project Updates</Label>
                              <FormDescription>
                                Receive notifications about project changes
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="projectUpdates"
                                disabled={!notificationForm.watch('emailNotifications')}
                              />
                            </FormControl>
                          </div>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="taskAssignments"
                        render={({ field }) => (
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="taskAssignments">Task Assignments</Label>
                              <FormDescription>
                                Receive notifications when tasks are assigned to you
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="taskAssignments"
                                disabled={!notificationForm.watch('emailNotifications')}
                              />
                            </FormControl>
                          </div>
                        )}
                      />
                      
                      <FormField
                        control={notificationForm.control}
                        name="securityAlerts"
                        render={({ field }) => (
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="securityAlerts">Security Alerts</Label>
                              <FormDescription>
                                Receive notifications about security events
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="securityAlerts"
                                disabled={!notificationForm.watch('emailNotifications')}
                              />
                            </FormControl>
                          </div>
                        )}
                      />
                      
                      <Separator />
                      
                      <FormField
                        control={notificationForm.control}
                        name="marketingEmails"
                        render={({ field }) => (
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="marketingEmails">Marketing Emails</Label>
                              <FormDescription>
                                Receive marketing and promotional emails
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="marketingEmails"
                                disabled={!notificationForm.watch('emailNotifications')}
                              />
                            </FormControl>
                          </div>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isUpdating || !notificationForm.formState.isDirty}
                      >
                        {isUpdating ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 