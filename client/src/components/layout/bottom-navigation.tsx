import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ListTodo, CheckSquare, Users, User, UserCheck, MessageCircle, Bell, UserPlus } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: "/", icon: Home, label: "الرئيسية", testId: "nav-dashboard" },
    { path: "/tasks", icon: ListTodo, label: "المهام", testId: "nav-tasks" },
    { path: "/customers", icon: UserPlus, label: "العملاء", testId: "nav-customers" },
    { path: "/messages", icon: MessageCircle, label: "الرسائل", testId: "nav-messages" },
    { path: "/team", icon: Users, label: "الفريق", testId: "nav-team" },
    { path: "/profile", icon: User, label: "الملف الشخصي", testId: "nav-profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-lg border-t border-border/50 z-50 safe-area-bottom shadow-2xl">
      <div className="grid grid-cols-6 h-14 sm:h-16 lg:h-18 max-w-full mx-auto">
        {navItems.map(({ path, icon: Icon, label, testId }) => (
          <Button
            key={path}
            variant="ghost"
            className={`flex flex-col items-center justify-center space-y-0.5 sm:space-y-1 h-full rounded-none touch-manipulation touch-target px-1 transition-all duration-200 ${
              location === path
                ? "text-primary bg-primary/10 scale-110"
                : "text-gray-400 hover:text-on-surface hover:bg-muted/30 hover:scale-105"
            }`}
            onClick={() => setLocation(path)}
            data-testid={testId}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs lg:text-sm font-medium truncate max-w-full text-center leading-tight">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
