import { Bell, UserCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/use-language";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export function TopAppBar() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get unread notifications count
  const { data: unreadCount = 0 } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const notificationCount = typeof unreadCount === 'object' && unreadCount !== null 
    ? (unreadCount as { count: number }).count 
    : 0;
  
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
    <header className="bg-primary text-primary-foreground px-3 sm:px-4 lg:px-6 py-2 sm:py-3 shadow-md">
      <div className="flex items-center justify-between max-w-full">
        <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse min-w-0 flex-shrink">
          <img 
            src="/attached_assets/319159472_2787094371424406_3593723820726937846_n_1755704545593.jpg" 
            alt="TaskFlow Logo" 
            className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full object-cover shadow-sm border-2 border-white/20 flex-shrink-0"
          />
          <h1 className="text-base sm:text-lg lg:text-xl font-medium truncate responsive-text" data-testid="text-app-title">TaskFlow</h1>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 rtl:space-x-reverse flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-dark rounded-full relative touch-target w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11"
            data-testid="button-notifications"
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-[10px] sm:text-xs font-bold min-w-[16px] sm:min-w-[20px]"
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-dark rounded-full touch-target w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11"
            data-testid="button-profile-menu"
          >
            <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-red-600/20 rounded-full touch-target w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
            title="تسجيل الخروج"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}
