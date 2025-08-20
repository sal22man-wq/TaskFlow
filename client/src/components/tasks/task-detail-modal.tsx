import { TaskWithAssignee, UpdateTask } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TeamMember } from "@shared/schema";
import { format } from "date-fns";

interface TaskDetailModalProps {
  task: TaskWithAssignee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || "");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""
  );
  const [progress, setProgress] = useState(task.progress);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: UpdateTask) => {
      const response = await apiRequest("PUT", `/api/tasks/${task.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Task updated successfully",
        description: "The task has been updated with your changes.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error updating task",
        description: "There was a problem updating the task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const updates: UpdateTask = {
      status,
      priority,
      assigneeId: assigneeId || undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      progress,
    };

    updateTaskMutation.mutate(updates);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="modal-task-details-title">Task Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-lg mb-2" data-testid="modal-task-title">
              {task.title}
            </h4>
            <p className="text-muted-foreground mb-4" data-testid="modal-task-description">
              {task.description}
            </p>
          </div>

          {/* Task Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Customer Name</Label>
              <p className="font-medium" data-testid="modal-task-customer">{task.customerName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Staff Name</Label>
              <p className="font-medium" data-testid="modal-task-staff">{task.staffName}</p>
            </div>
            <div className="col-span-2">
              <Label className="text-sm font-medium text-muted-foreground">Time/Schedule</Label>
              <p className="font-medium" data-testid="modal-task-time">{task.time}</p>
            </div>
            {task.notes && (
              <div className="col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                <p className="text-sm" data-testid="modal-task-notes">{task.notes}</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status" className="text-sm font-medium text-muted-foreground">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1" data-testid="select-task-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_be_completed">To be completed</SelectItem>
                  <SelectItem value="started">Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority" className="text-sm font-medium text-muted-foreground">
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1" data-testid="select-task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="assignee" className="text-sm font-medium text-muted-foreground">
              Assigned to
            </Label>
            <Select value={assigneeId === null ? "unassigned" : assigneeId} onValueChange={(value) => setAssigneeId(value === "unassigned" ? "" : value)}>
              <SelectTrigger className="mt-1" data-testid="select-task-assignee">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {task.assignee && (
              <div className="flex items-center space-x-3 mt-2">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium">
                  {task.assignee.avatar || task.assignee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium" data-testid="modal-assignee-name">{task.assignee.name}</p>
                  <p className="text-sm text-muted-foreground" data-testid="modal-assignee-role">
                    {task.assignee.role}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="dueDate" className="text-sm font-medium text-muted-foreground">
              Due Date
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1"
              data-testid="input-task-due-date"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Progress</Label>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span data-testid="modal-task-progress">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <Input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="mt-2"
                data-testid="input-task-progress"
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={updateTaskMutation.isPending}
              data-testid="button-save-task"
            >
              {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              className="px-6"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-task"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
