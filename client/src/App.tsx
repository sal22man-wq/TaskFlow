import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { LanguageProvider } from "@/hooks/use-language";
import { AuthProvider } from "@/components/auth/auth-provider";
import { useAuth } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import MyTasks from "@/pages/my-tasks";
import Team from "@/pages/team.tsx";
import Profile from "@/pages/profile.tsx";
import Customers from "@/pages/customers";
import AdminLogs from "@/pages/admin-logs";
import AdminUsers from "@/pages/admin-users";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import { AdminGuard } from "@/components/admin/admin-guard";
import { WelcomeModal } from "@/components/welcome-modal";

function ProtectedRouter() {
  const { user, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <LanguageProvider>
        <LoginPage onLoginSuccess={login} />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <MobileLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/my-tasks" component={MyTasks} />
          <Route path="/team" component={Team} />
          <Route path="/customers" component={Customers} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin/logs" component={() => <AdminGuard><AdminLogs /></AdminGuard>} />
          <Route path="/admin/users" component={() => <AdminGuard><AdminUsers /></AdminGuard>} />
          <Route component={NotFound} />
        </Switch>
      </MobileLayout>
    </LanguageProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <WelcomeModal />
          <ProtectedRouter />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
