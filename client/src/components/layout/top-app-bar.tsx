import { Bell, UserCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { LanguageToggleButton } from "@/components/ui/language-switcher";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function TopAppBar() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
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
    <header className="bg-primary text-primary-foreground px-4 py-3 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <img 
            src="/attached_assets/319159472_2787094371424406_3593723820726937846_n_1755704545593.jpg" 
            alt="TaskFlow Logo" 
            className="w-8 h-8 rounded-full object-cover shadow-sm border-2 border-white/20"
          />
          <h1 className="text-lg font-medium" data-testid="text-app-title">TaskFlow</h1>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <LanguageToggleButton />
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-dark rounded-full"
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-dark rounded-full"
            data-testid="button-profile-menu"
          >
            <UserCircle className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-red-600/20 rounded-full"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
            title="تسجيل الخروج"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
