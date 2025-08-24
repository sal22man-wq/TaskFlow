import { TaskWithAssignees } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, User, Calendar, CalendarClock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { TaskDetailModal } from "./task-detail-modal";
import { StatusActions } from "./status-actions";
import { ChatButton } from "@/components/chat/chat-button";
import { RescheduleTaskModal } from "./reschedule-task-modal";
import { CancelTaskModal } from "./cancel-task-modal";
import { useAuth } from "@/hooks/use-auth";

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
        return "bg-green-500 text-white border-green-600"; // أخضر ممتلئ للمهام المكتملة
      case "start":
        return "bg-purple-500 text-white border-purple-600"; // بنفسجي ممتلئ للمهام التي بدأت
      case "cancelled":
        return "bg-red-500 text-white border-red-600";
      case "rescheduled":
        return "bg-indigo-500 text-white border-indigo-600"; // تغيير المؤجلة إلى النيلي لتجنب التداخل
      case "pending":
      default:
        return "bg-red-500 text-white border-red-600"; // أحمر ممتلئ للمهام في الانتظار
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

  // Generate card background colors based on task status
  const getCardBackgroundColor = (status: string) => {
    switch (status) {
      case "complete":
        return "border-l-green-500 bg-green-50/50"; // خلفية خضراء فاتحة للمهام المكتملة
      case "start":
        return "border-l-purple-500 bg-purple-50/50"; // خلفية بنفسجية فاتحة للمهام التي بدأت
      case "cancelled":
        return "border-l-red-500 bg-red-50/50";
      case "rescheduled":
        return "border-l-indigo-500 bg-indigo-50/50"; // تغيير المؤجلة إلى النيلي لتجنب التداخل
      case "pending":
      default:
        return "border-l-red-500 bg-orange-50/50"; // خلفية برتقالية فاتحة للمهام في الانتظار
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-green-700 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return priority;
    }
  };

  // Check if user can reschedule/cancel tasks (admin/supervisor only)
  const canManageTask = (user as any)?.role === "admin" || (user as any)?.role === "supervisor";
  
  // Don't show reschedule/cancel for completed or already cancelled tasks
  const canReschedule = canManageTask && task.status !== "complete" && task.status !== "cancelled";
  const canCancel = canManageTask && task.status !== "complete" && task.status !== "cancelled";

  return (
    <>
      <div className="task-card" data-testid={`task-card-${task.id}`}>
        <Card className={`hover:shadow-md transition-all duration-200 border-l-4 ${getCardBackgroundColor(task.status)} hover:scale-[1.01] backdrop-blur-sm`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3 rtl:flex-row-reverse">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {task.taskNumber && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold" data-testid={`task-number-${task.id}`}>
                      #{task.taskNumber}
                    </span>
                  )}
                  {task.priority && (
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                  )}
                </div>
                <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2" data-testid={`task-title-${task.id}`}>
                  {task.title}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2" data-testid={`task-description-${task.id}`}>
                  {task.description}
                </p>
              </div>
              <Badge className={`${getStatusColor(task.status)} border text-xs whitespace-nowrap ml-2`} data-testid={`task-status-${task.id}`}>
                {getStatusLabel(task.status)}
              </Badge>
            </div>
        
            <div className="space-y-3 mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 rtl:flex-row-reverse">
                <div className="flex items-center gap-3 rtl:space-x-reverse">
                  {task.assignees && task.assignees.length > 0 && (
                    <div className="flex items-center gap-1 rtl:space-x-reverse">
                      <User className="h-3 w-3" />
                      <span data-testid={`task-assignee-${task.id}`}>
                        {task.assignees[0].name}
                        {task.assignees.length > 1 && ` +${task.assignees.length - 1}`}
                      </span>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1 rtl:space-x-reverse">
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
                  className="text-primary hover:text-primary-dark p-1 h-auto"
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
                      className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 text-xs px-2 py-1"
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
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 text-xs px-2 py-1"
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
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    تم تأجيل هذه المهمة {(task as any).rescheduleCount} مرة
                  </p>
                  {(task as any).rescheduleReason && (
                    <p className="text-xs text-yellow-600 mt-1">
                      السبب: {(task as any).rescheduleReason}
                    </p>
                  )}
                </div>
              )}

              {task.status === "cancelled" && (task as any).cancellationReason && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700">
                    سبب الإلغاء: {(task as any).cancellationReason}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <TaskDetailModal 
        task={task}
        open={showDetails}
        onOpenChange={setShowDetails}
      />

      <RescheduleTaskModal
        taskId={task.id}
        open={showReschedule}
        onOpenChange={setShowReschedule}
      />

      <CancelTaskModal
        taskId={task.id}
        open={showCancel}
        onOpenChange={setShowCancel}
      />
    </>
  );
}