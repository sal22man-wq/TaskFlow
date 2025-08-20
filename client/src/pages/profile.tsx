import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Settings, Bell, Shield, HelpCircle, LogOut, UserCheck, Activity, Edit, Save, X } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";

// Profile update schema
const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().min(1, "الاسم الأخير مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  phone: z.string().optional(),
});

// Password change schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Get current user data
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Profile update form
  const profileForm = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: (user as any)?.firstName || '',
        lastName: (user as any)?.lastName || '',
        email: (user as any)?.email || '',
        phone: (user as any)?.phone || '',
      });
    }
  }, [user, profileForm]);

  // Password change form
  const passwordForm = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Profile update mutation
  const profileUpdateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileUpdateSchema>) => {
      console.log("Updating profile with data:", data);
      return await apiRequest("PUT", "/api/auth/profile", data);
    },
    onSuccess: (response) => {
      console.log("Profile update success:", response);
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث معلومات الملف الشخصي",
      });
      setIsEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث معلومات الملف الشخصي",
        variant: "destructive",
      });
    },
  });

  // Password change mutation
  const passwordChangeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordChangeSchema>) => {
      return await apiRequest("PUT", "/api/auth/change-password", data);
    },
    onSuccess: () => {
      toast({
        title: "تم تغيير كلمة المرور",
        description: "تم تغيير كلمة المرور بنجاح",
      });
      setIsChangingPassword(false);
      passwordForm.reset();
    },
    onError: () => {
      toast({
        title: "خطأ في تغيير كلمة المرور",
        description: "فشل في تغيير كلمة المرور. تأكد من كلمة المرور الحالية",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "تم تسجيل خروجك من النظام",
      });
      // Clear all queries and reload the page
      queryClient.clear();
      window.location.reload();
    },
    onError: () => {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-lg font-semibold text-primary mb-2" data-testid="text-welcome-message">
          اهلا بكم في برنامج تتبع العمل في شركة اشراق الودق لتكنولوجيا المعلومات
        </h1>
      </div>
      
      <h2 className="text-xl font-medium mb-4" data-testid="text-profile-title">
        {t('nav.profile')}
      </h2>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>معلومات المستخدم</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl">
              {(user as any)?.teamMember?.avatar || (user as any)?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h3 className="font-medium text-lg" data-testid="text-user-name">{(user as any)?.teamMember?.name || (user as any)?.username || "مستخدم"}</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-user-role">{(user as any)?.teamMember?.role || "عضو فريق"} - شركة اشراق الودق</p>
              <p className="text-xs text-muted-foreground" data-testid="text-user-email">{(user as any)?.teamMember?.email}</p>
              {/* User Permission Level */}
              <div className="flex items-center mt-2 space-x-2 space-x-reverse">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">مستوى الصلاحيات:</span>
                {(user as any)?.role === 'admin' && (
                  <Badge className="bg-red-100 text-red-800">مدير النظام</Badge>
                )}
                {(user as any)?.role === 'supervisor' && (
                  <Badge className="bg-blue-100 text-blue-800">مشرف</Badge>
                )}
                {((user as any)?.role === 'user' || !(user as any)?.role) && (
                  <Badge className="bg-gray-100 text-gray-800">مستخدم عادي</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>إعدادات المعلومات الشخصية</span>
            </div>
            {!isEditingProfile && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditingProfile(true)}
                data-testid="button-edit-profile"
              >
                <Edit className="h-4 w-4 mr-1" />
                تعديل
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditingProfile ? (
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit((data) => profileUpdateMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الأول</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-first-name" />
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
                        <FormLabel>الاسم الأخير</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-last-name" />
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
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف (اختياري)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-2 space-x-reverse">
                  <Button 
                    type="submit" 
                    disabled={profileUpdateMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {profileUpdateMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditingProfile(false);
                      profileForm.reset();
                    }}
                    data-testid="button-cancel-profile"
                  >
                    <X className="h-4 w-4 mr-1" />
                    إلغاء
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">الاسم الكامل</Label>
                <p className="text-sm text-muted-foreground">
                  {((user as any)?.firstName && (user as any)?.lastName) 
                    ? `${(user as any)?.firstName} ${(user as any)?.lastName}` 
                    : 'غير محدد'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">البريد الإلكتروني</Label>
                <p className="text-sm text-muted-foreground">{(user as any)?.email || 'غير محدد'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">رقم الهاتف</Label>
                <p className="text-sm text-muted-foreground">{(user as any)?.phone || 'غير محدد'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>تغيير كلمة المرور</span>
            </div>
            {!isChangingPassword && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsChangingPassword(true)}
                data-testid="button-change-password"
              >
                <Edit className="h-4 w-4 mr-1" />
                تغيير
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isChangingPassword ? (
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit((data) => passwordChangeMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور الحالية</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} data-testid="input-current-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور الجديدة</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} data-testid="input-new-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} data-testid="input-confirm-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-2 space-x-reverse">
                  <Button 
                    type="submit" 
                    disabled={passwordChangeMutation.isPending}
                    data-testid="button-save-password"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {passwordChangeMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsChangingPassword(false);
                      passwordForm.reset();
                    }}
                    data-testid="button-cancel-password"
                  >
                    <X className="h-4 w-4 mr-1" />
                    إلغاء
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                انقر على "تغيير" لتحديث كلمة المرور الخاصة بك
              </p>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">كلمة المرور محمية بتشفير قوي</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Functions - Only show for admin users */}
      {(user as any)?.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>وظائف المدير</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => setLocation("/admin/users")}
              data-testid="button-admin-users"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              إدارة المستخدمين
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setLocation("/admin/logs")}
              data-testid="button-admin-logs"
            >
              <Activity className="h-4 w-4 mr-2" />
              سجل أحداث النظام
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Other Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>إعدادات أخرى</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notification Settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>إعدادات الإشعارات</span>
            </div>
            <Button variant="outline" size="sm" disabled>
              قريباً
            </Button>
          </div>
          
          {/* Help */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-4 w-4" />
              <span>المساعدة والدعم</span>
            </div>
            <Button variant="outline" size="sm" disabled>
              قريباً
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {logoutMutation.isPending ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}