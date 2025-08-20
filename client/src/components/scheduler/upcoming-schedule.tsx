import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, User } from "lucide-react";
import { TaskWithAssignees } from "@shared/schema";
import { format, isToday, isTomorrow, addDays } from "date-fns";

export function UpcomingSchedule() {
  const { data: tasks } = useQuery<TaskWithAssignees[]>({
    queryKey: ["/api/tasks"],
  });

  // Filter upcoming tasks (next 7 days)
  const upcomingTasks = tasks?.filter(task => {
    if (!task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    const today = new Date();
    const nextWeek = addDays(today, 7);
    return taskDate >= today && taskDate <= nextWeek && task.status !== "complete";
  })
  .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()) || [];

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d, EEE");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5" />
          Upcoming Schedule ({upcomingTasks.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          <div className="p-4 space-y-3">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  data-testid={`upcoming-task-${task.id}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate" data-testid={`upcoming-task-title-${task.id}`}>
                        {task.title}
                      </h3>
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span data-testid={`upcoming-task-date-${task.id}`}>
                          {task.dueDate && getDateLabel(new Date(task.dueDate))}
                        </span>
                      </div>
                      
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(new Date(task.dueDate), "HH:mm")}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <span>Customer: {task.customerName}</span>
                      </div>
                    </div>
                    
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {task.assignees.map((assignee, index) => (
                            <Badge key={assignee.id} variant="outline" className="text-xs px-1">
                              {assignee.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {task.progress > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div 
                            className="bg-primary rounded-full h-1 transition-all"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-upcoming-tasks">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                <p>No upcoming tasks in the next 7 days</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}