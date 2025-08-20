import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { LanguageProvider } from "@/hooks/use-language";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import MyTasks from "@/pages/my-tasks";
import Team from "@/pages/team.tsx";
import Profile from "@/pages/profile.tsx";
import Customers from "@/pages/customers";
import AdminLogs from "@/pages/admin-logs";
import NotFound from "@/pages/not-found";
import { AdminGuard } from "@/components/admin/admin-guard";

function Router() {
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
          <Route component={NotFound} />
        </Switch>
      </MobileLayout>
    </LanguageProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
