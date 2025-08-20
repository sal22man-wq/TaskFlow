import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, Settings, Bell, Shield, HelpCircle, LogOut, UserCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  // Get current user data
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
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
              {(user as any)?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h3 className="font-medium text-lg" data-testid="text-user-name">{(user as any)?.username || "مستخدم"}</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-user-role">عضو فريق - شركة اشراق الودق</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Options */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-left"
          data-testid="button-settings"
        >
          <Settings className="h-5 w-5 mr-3" />
          الإعدادات
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-left"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5 mr-3" />
          الإشعارات
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-left"
          data-testid="button-privacy"
        >
          <Shield className="h-5 w-5 mr-3" />
          الخصوصية والأمان
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-left"
          data-testid="button-help"
        >
          <HelpCircle className="h-5 w-5 mr-3" />
          المساعدة والدعم
        </Button>

        {/* Admin-only options */}
        {(user as any)?.role === "admin" && (
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 px-3">
              خيارات المدير
            </h4>
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-left text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => setLocation("/admin/users")}
              data-testid="button-admin-users"
            >
              <UserCheck className="h-5 w-5 mr-3" />
              إدارة المستخدمين
            </Button>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-left text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5 mr-3" />
            {logoutMutation.isPending ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
          </Button>
        </div>
      </div>

      {/* App Info */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <h4 className="font-medium" data-testid="text-app-name">TaskFlow</h4>
            <p className="text-sm" data-testid="text-app-version">Version 1.0.0</p>
            <p className="text-xs mt-2" data-testid="text-app-description">
              Team task management made simple
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
