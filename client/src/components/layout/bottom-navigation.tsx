import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ListTodo, CheckSquare, Users, User, UserCheck } from "lucide-react";

export function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard", testId: "nav-dashboard" },
    { path: "/tasks", icon: ListTodo, label: "Tasks", testId: "nav-tasks" },
    { path: "/my-tasks", icon: CheckSquare, label: "My Tasks", testId: "nav-my-tasks" },
    { path: "/customers", icon: UserCheck, label: "Customers", testId: "nav-customers" },
    { path: "/team", icon: Users, label: "Team", testId: "nav-team" },
    { path: "/profile", icon: User, label: "Profile", testId: "nav-profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-surface border-t border-surface-variant">
      <div className="grid grid-cols-6 h-16">
        {navItems.map(({ path, icon: Icon, label, testId }) => (
          <Button
            key={path}
            variant="ghost"
            className={`flex flex-col items-center justify-center space-y-1 h-full rounded-none touch-manipulation ${
              location === path
                ? "text-primary"
                : "text-gray-400 hover:text-on-surface"
            }`}
            onClick={() => setLocation(path)}
            data-testid={testId}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-medium">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
