import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { AddMemberForm } from "@/components/team/add-member-form.tsx";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/use-language";

export function QuickActions() {
  const [, setLocation] = useLocation();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3" data-testid="text-quick-actions-title">إجراءات سريعة</h3>
        <div className="grid grid-cols-3 gap-3">
          <Button
            className="bg-primary text-primary-foreground p-4 rounded-lg shadow-sm flex flex-col items-center space-y-2 hover:bg-primary-dark transition-colors h-auto touch-manipulation"
            onClick={() => setShowCreateTask(true)}
            data-testid="button-quick-new-task"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">مهمة جديدة</span>
          </Button>
          
          <Button
            className="bg-secondary text-secondary-foreground p-4 rounded-lg shadow-sm flex flex-col items-center space-y-2 hover:opacity-90 transition-opacity h-auto touch-manipulation"
            onClick={() => setShowAddMember(true)}
            data-testid="button-quick-add-member"
          >
            <UserPlus className="h-5 w-5" />
            <span className="text-sm font-medium">إضافة عضو</span>
          </Button>
          
          <Button
            className="bg-secondary text-secondary-foreground p-4 rounded-lg shadow-sm flex flex-col items-center space-y-2 hover:opacity-90 transition-opacity h-auto touch-manipulation"
            onClick={() => setLocation("/admin/users")}
            data-testid="button-quick-admin"
          >
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">إدارة</span>
          </Button>
        </div>
      </div>

      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <CreateTaskForm onSuccess={() => setShowCreateTask(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="sm:max-w-md">
          <AddMemberForm onSuccess={() => setShowAddMember(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
