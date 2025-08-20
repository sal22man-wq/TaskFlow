import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Settings, Bell, Shield, HelpCircle, LogOut } from "lucide-react";

export default function Profile() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-medium mb-4" data-testid="text-profile-title">
        Profile
      </h2>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>User Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl">
              AD
            </div>
            <div>
              <h3 className="font-medium text-lg" data-testid="text-user-name">Admin User</h3>
              <p className="text-muted-foreground" data-testid="text-user-email">admin@taskflow.com</p>
              <p className="text-sm text-muted-foreground" data-testid="text-user-role">Team Administrator</p>
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
          Settings
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-left"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5 mr-3" />
          Notifications
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-left"
          data-testid="button-privacy"
        >
          <Shield className="h-5 w-5 mr-3" />
          Privacy & Security
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-left"
          data-testid="button-help"
        >
          <HelpCircle className="h-5 w-5 mr-3" />
          Help & Support
        </Button>

        <div className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-left text-destructive hover:text-destructive hover:bg-destructive/10"
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
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
