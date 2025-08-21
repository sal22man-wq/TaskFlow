import { TopAppBar } from "./top-app-bar";
import { BottomNavigation } from "./bottom-navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChatButton } from "@/components/chat/chat-button";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [showCreateTask, setShowCreateTask] = useState(false);

  return (
    <div className="mobile-container crisp-text">
      <TopAppBar />
      
      <main className="flex-1 overflow-y-auto pb-20 touch-manipulation responsive-padding">
        <div className="w-full max-w-full">
          {children}
        </div>
        
        {/* Copyright Footer */}
        <footer className="mt-8 py-4 border-t bg-background/95 backdrop-blur">
          <div className="text-center text-xs sm:text-sm text-muted-foreground px-4">
            <p className="mb-1">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
            <p className="font-medium text-primary">شركة اشراق الودق لتكنولوجيا المعلومات</p>
          </div>
        </footer>
      </main>
      
      <BottomNavigation />
      
      {/* Floating Action Buttons - Responsive */}
      <Button
        className="fixed bottom-20 right-4 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full shadow-lg z-10 touch-manipulation touch-target"
        size="icon"
        onClick={() => setShowCreateTask(true)}
        data-testid="button-create-task"
      >
        <Plus className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
      </Button>

      {/* Floating Chat Button */}
      <ChatButton variant="floating" />

      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg lg:max-w-xl max-h-[85vh] overflow-y-auto">
          <CreateTaskForm onSuccess={() => setShowCreateTask(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
