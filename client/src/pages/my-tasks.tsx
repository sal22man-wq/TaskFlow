import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { Clock, AlertTriangle, CheckCircle2, Calendar, MessageSquare, User } from "lucide-react";
import { TaskWithAssignees, TeamMember } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function MyTasksPage() {
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignees | null>(null);
  
  const { data: tasks, isLoading: tasksLoading } = useQuery<TaskWithAssignees[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: teamMembers, isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  // Filter tasks by different categories
  const priorityTasks = tasks?.filter(task => task.priority === "high") || [];
  const overdueTasks = tasks?.filter(task => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.status !== "completed";
  }) || [];
  
  const upcomingTasks = tasks?.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= nextWeek && task.status !== "completed";
  }) || [];

  const tasksWithComments = tasks?.filter(task => task.notes && task.notes.length > 0) || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600";
      case "in_progress": return "text-blue-600";
      case "to_be_completed": return "text-orange-600";
      default: return "text-gray-600";
    }
  };

  const TaskCard = ({ task, showAssignees = true }: { task: TaskWithAssignees; showAssignees?: boolean }) => (
    <Card 
      key={task.id} 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setSelectedTask(task)}
      data-testid={`card-my-task-${task.id}`}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-sm leading-tight" data-testid={`text-task-title-${task.id}`}>
              {task.title}
            </h3>
            <Badge variant={getPriorityColor(task.priority)} className="text-xs">
              {task.priority}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2" data-testid={`text-task-description-${task.id}`}>
            {task.description}
          </p>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Customer: {task.customerName}</span>
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-muted-foreground'}`}>
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
          
          {task.progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-2" />
            </div>
          )}
          
          {showAssignees && task.assignees && task.assignees.length > 0 && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-muted-foreground" />
              <div className="flex flex-wrap gap-1">
                {task.assignees.map((assignee) => (
                  <Badge key={assignee.id} variant="outline" className="text-xs px-1">
                    {assignee.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (tasksLoading || teamLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <div className="grid gap-3">
              {[...Array(2)].map((_, j) => (
                <Skeleton key={j} className="h-24 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="p-4">
        <h1 className="text-2xl font-bold mb-2" data-testid="text-my-tasks-title">My Tasks</h1>
        <p className="text-muted-foreground text-sm">Personal task overview with priorities and reminders</p>
      </section>

      {/* Priority Tasks */}
      <section className="px-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-medium" data-testid="text-priority-tasks-title">
            High Priority Tasks ({priorityTasks.length})
          </h2>
        </div>
        
        <div className="space-y-3">
          {priorityTasks.length > 0 ? (
            priorityTasks.map(task => <TaskCard key={task.id} task={task} />)
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground" data-testid="text-no-priority-tasks">
                  No high priority tasks at the moment
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Overdue Tasks */}
      <section className="px-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-medium" data-testid="text-overdue-tasks-title">
            Overdue Tasks ({overdueTasks.length})
          </h2>
        </div>
        
        <div className="space-y-3">
          {overdueTasks.length > 0 ? (
            overdueTasks.map(task => <TaskCard key={task.id} task={task} />)
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-muted-foreground" data-testid="text-no-overdue-tasks">
                  Great! No overdue tasks
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Upcoming Tasks */}
      <section className="px-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-medium" data-testid="text-upcoming-tasks-title">
            Upcoming This Week ({upcomingTasks.length})
          </h2>
        </div>
        
        <div className="space-y-3">
          {upcomingTasks.length > 0 ? (
            upcomingTasks.map(task => <TaskCard key={task.id} task={task} />)
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground" data-testid="text-no-upcoming-tasks">
                  No upcoming tasks this week
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Tasks with Comments/Notes */}
      <section className="px-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-medium" data-testid="text-tasks-with-comments-title">
            Tasks with Comments ({tasksWithComments.length})
          </h2>
        </div>
        
        <div className="space-y-3">
          {tasksWithComments.length > 0 ? (
            tasksWithComments.map(task => (
              <Card 
                key={task.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedTask(task)}
                data-testid={`card-task-with-comment-${task.id}`}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-sm" data-testid={`text-commented-task-title-${task.id}`}>
                        {task.title}
                      </h3>
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                    
                    <div className="bg-muted/50 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquare className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Comment:</span>
                      </div>
                      <p className="text-xs" data-testid={`text-task-comment-${task.id}`}>
                        {task.notes}
                      </p>
                    </div>
                    
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {task.assignees.map((assignee) => (
                            <Badge key={assignee.id} variant="outline" className="text-xs px-1">
                              {assignee.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground" data-testid="text-no-commented-tasks">
                  No tasks with comments yet
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}
    </div>
  );
}