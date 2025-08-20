import { TaskWithAssignee } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ChevronRight, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { TaskDetailModal } from "./task-detail-modal";

interface TaskCardProps {
  task: TaskWithAssignee;
}

export function TaskCard({ task }: TaskCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "status-completed";
      case "started":
      case "in_progress":
        return "status-in_progress";
      case "overdue":
        return "status-overdue";
      default:
        return "status-to_be_completed";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "to_be_completed":
        return "To Do";
      case "started":
        return "Started";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "overdue":
        return "Overdue";
      default:
        return status;
    }
  };

  return (
    <>
      <div className="task-card" data-testid={`task-card-${task.id}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-base text-on-surface" data-testid={`task-title-${task.id}`}>
              {task.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1" data-testid={`task-description-${task.id}`}>
              {task.description}
            </p>
          </div>
          <span 
            className={`status-chip ${getStatusColor(task.status)} ml-3`}
            data-testid={`task-status-${task.id}`}
          >
            {getStatusLabel(task.status)}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            {task.assignee && (
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span data-testid={`task-assignee-${task.id}`}>{task.assignee.name}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span data-testid={`task-due-date-${task.id}`}>
                  {format(new Date(task.dueDate), "MMM dd")}
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary-dark p-0 h-auto"
            onClick={() => setShowDetails(true)}
            data-testid={`button-task-details-${task.id}`}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <TaskDetailModal 
        task={task}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </>
  );
}
