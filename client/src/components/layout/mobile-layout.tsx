import { TopAppBar } from "./top-app-bar";
import { BottomNavigation } from "./bottom-navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [showCreateTask, setShowCreateTask] = useState(false);

  return (
    <div className="mobile-container">
      <TopAppBar />
      
      <main className="flex-1 overflow-y-auto pb-20 touch-manipulation">
        {children}
      </main>
      
      <BottomNavigation />
      
      {/* Floating Action Button */}
      <Button
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg z-10 touch-manipulation"
        size="icon"
        onClick={() => setShowCreateTask(true)}
        data-testid="button-create-task"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="sm:max-w-md">
          <CreateTaskForm onSuccess={() => setShowCreateTask(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
