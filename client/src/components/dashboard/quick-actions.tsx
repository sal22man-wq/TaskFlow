import { Button } from "@/components/ui/button";
import { Plus, UserPlus, UserCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { AddMemberForm } from "@/components/team/add-member-form.tsx";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function QuickActions() {
  const [, setLocation] = useLocation();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3" data-testid="text-quick-actions-title">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          <Button
            className="bg-primary text-primary-foreground p-4 rounded-lg shadow-sm flex flex-col items-center space-y-2 hover:bg-primary-dark transition-colors h-auto touch-manipulation"
            onClick={() => setShowCreateTask(true)}
            data-testid="button-quick-new-task"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm font-medium">New Task</span>
          </Button>
          
          <Button
            className="bg-secondary text-secondary-foreground p-4 rounded-lg shadow-sm flex flex-col items-center space-y-2 hover:opacity-90 transition-opacity h-auto touch-manipulation"
            onClick={() => setShowAddMember(true)}
            data-testid="button-quick-add-member"
          >
            <UserPlus className="h-5 w-5" />
            <span className="text-sm font-medium">Add Member</span>
          </Button>
          
          <Button
            className="bg-info text-info-foreground p-4 rounded-lg shadow-sm flex flex-col items-center space-y-2 hover:opacity-90 transition-opacity h-auto touch-manipulation"
            onClick={() => setLocation("/customers")}
            data-testid="button-quick-customers"
          >
            <UserCheck className="h-5 w-5" />
            <span className="text-sm font-medium">Customers</span>
          </Button>
        </div>
      </div>

      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="sm:max-w-md">
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
