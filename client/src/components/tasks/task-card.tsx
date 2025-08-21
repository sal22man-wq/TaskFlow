import { TaskWithAssignees } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ChevronRight, User, Calendar, CalendarClock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { TaskDetailModal } from "./task-detail-modal";
import { StatusActions } from "./status-actions";
import { ChatButton } from "@/components/chat/chat-button";
import { RescheduleTaskModal } from "./reschedule-task-modal";
import { CancelTaskModal } from "./cancel-task-modal";
import { useAuth } from "@/hooks/useAuth";

interface TaskCardProps {
  task: TaskWithAssignees;
}

export function TaskCard({ task }: TaskCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800 border-green-300";
      case "start":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      case "rescheduled":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "pending":
      default:
        return "bg-orange-100 text-orange-800 border-orange-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "في الانتظار";
      case "start":
        return "بدأت";
      case "complete":
        return "مكتملة";
      case "cancelled":
        return "ملغاة";
      case "rescheduled":
        return "مؤجلة";
      default:
        return status;
    }
  };

  // Check if user can reschedule/cancel tasks (admin/supervisor only)
  const canManageTask = user?.role === "admin" || user?.role === "supervisor";
  
  // Don't show reschedule/cancel for completed or already cancelled tasks
  const canReschedule = canManageTask && task.status !== "complete" && task.status !== "cancelled";
  const canCancel = canManageTask && task.status !== "complete" && task.status !== "cancelled";

  return (
    <>
      <div className="task-card" data-testid={`task-card-${task.id}`}>
        <div className="flex items-start justify-between mb-3 rtl:flex-row-reverse">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {task.taskNumber && (
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold" data-testid={`task-number-${task.id}`}>
                  #{task.taskNumber}
                </span>
              )}
              <h4 className="font-medium text-base text-on-surface" data-testid={`task-title-${task.id}`}>
                {task.title}
              </h4>
            </div>
            <p className="text-sm text-muted-foreground mt-1" data-testid={`task-description-${task.id}`}>
              {task.description}
            </p>
          </div>
          <span 
            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)} ml-3 rtl:mr-3 rtl:ml-0`}
            data-testid={`task-status-${task.id}`}
          >
            {getStatusLabel(task.status)}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground rtl:flex-row-reverse">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {task.assignees && task.assignees.length > 0 && (
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  <User className="h-3 w-3" />
                  <span data-testid={`task-assignee-${task.id}`}>
                    {task.assignees[0].name}
                    {task.assignees.length > 1 && ` +${task.assignees.length - 1}`}
                  </span>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
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
          
          {/* Status Actions and Management */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <StatusActions
                taskId={task.id}
                currentStatus={task.status}
              />
              
              {/* Reschedule Button */}
              {canReschedule && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReschedule(true)}
                  className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                  data-testid={`button-reschedule-${task.id}`}
                >
                  <CalendarClock className="w-3 h-3 mr-1" />
                  تأجيل
                </Button>
              )}
              
              {/* Cancel Button */}
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancel(true)}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  data-testid={`button-cancel-${task.id}`}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  إلغاء
                </Button>
              )}
            </div>
            
            <ChatButton taskId={task.id} taskTitle={task.title} />
          </div>

          {/* Reschedule/Cancellation Info */}
          {(task as any).rescheduleCount > 0 && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
              <span className="font-medium text-amber-800">
                تم تأجيل هذه المهمة {(task as any).rescheduleCount} مرة
              </span>
              {(task as any).rescheduleReason && (
                <p className="text-amber-700 mt-1">
                  آخر سبب تأجيل: {(task as any).rescheduleReason}
                </p>
              )}
            </div>
          )}

          {task.status === "cancelled" && (task as any).cancellationReason && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
              <span className="font-medium text-red-800">
                تم إلغاء المهمة بواسطة: {(task as any).cancelledBy === "customer" ? "العميل" : 
                                        (task as any).cancelledBy === "admin" ? "الإدارة" : "النظام"}
              </span>
              <p className="text-red-700 mt-1">
                السبب: {(task as any).cancellationReason}
              </p>
            </div>
          )}
        </div>
      </div>

      <TaskDetailModal 
        task={task}
        open={showDetails}
        onOpenChange={setShowDetails}
      />

      {/* Reschedule Modal */}
      {task.dueDate && (
        <RescheduleTaskModal
          taskId={task.id}
          taskTitle={task.title}
          currentDueDate={task.dueDate}
          rescheduleCount={(task as any).rescheduleCount || 0}
          open={showReschedule}
          onOpenChange={setShowReschedule}
        />
      )}

      {/* Cancel Modal */}
      <CancelTaskModal
        taskId={task.id}
        taskTitle={task.title}
        customerName={task.customerName}
        open={showCancel}
        onOpenChange={setShowCancel}
      />
    </>
  );
}
