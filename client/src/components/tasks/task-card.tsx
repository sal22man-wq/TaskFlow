import { TaskWithAssignees } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ChevronRight, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { TaskDetailModal } from "./task-detail-modal";
import { StatusActions } from "./status-actions";
import { ChatButton } from "@/components/chat/chat-button";

interface TaskCardProps {
  task: TaskWithAssignees;
}

export function TaskCard({ task }: TaskCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800 border-green-300";
      case "start":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "pending":
      default:
        return "bg-orange-100 text-orange-800 border-orange-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "start":
        return "Started";
      case "complete":
        return "Complete";
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
            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)} ml-3`}
            data-testid={`task-status-${task.id}`}
          >
            {getStatusLabel(task.status)}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              {task.assignees && task.assignees.length > 0 && (
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span data-testid={`task-assignee-${task.id}`}>
                    {task.assignees[0].name}
                    {task.assignees.length > 1 && ` +${task.assignees.length - 1}`}
                  </span>
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
          
          {/* Status Actions and Chat */}
          <div className="flex items-center justify-between">
            <StatusActions
              taskId={task.id}
              currentStatus={task.status}
            />
            <ChatButton taskId={task.id} taskTitle={task.title} />
          </div>
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
