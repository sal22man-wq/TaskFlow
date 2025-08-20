import { Bell, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopAppBar() {
  return (
    <header className="bg-primary text-primary-foreground px-4 py-3 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-xl">📋</div>
          <h1 className="text-lg font-medium" data-testid="text-app-title">TaskFlow</h1>
        </div>
        <div className="flex items-center space-x-1">
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
        </div>
      </div>
    </header>
  );
}
