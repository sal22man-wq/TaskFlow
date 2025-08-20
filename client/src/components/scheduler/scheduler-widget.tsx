import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { TaskWithAssignees } from "@shared/schema";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, isToday } from "date-fns";
import { useLanguage } from "@/hooks/use-language";

export function SchedulerWidget() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { t } = useLanguage();
  
  const { data: tasks } = useQuery<TaskWithAssignees[]>({
    queryKey: ["/api/tasks"],
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter tasks with due dates in the current week
  const scheduledTasks = tasks?.filter(task => 
    task.dueDate && 
    new Date(task.dueDate) >= weekStart && 
    new Date(task.dueDate) <= weekEnd
  ) || [];

  const getTasksForDay = (date: Date) => {
    return scheduledTasks.filter(task => 
      task.dueDate && isSameDay(new Date(task.dueDate), date)
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete": return "bg-green-50 border-green-300 shadow-green-100";
      case "start": return "bg-blue-50 border-blue-300 shadow-blue-100";
      case "pending": return "bg-orange-50 border-orange-300 shadow-orange-100";
      default: return "bg-gray-50 border-gray-200 shadow-gray-100";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5" />
            {t('dashboard.weeklySchedule')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2" data-testid="text-current-week">
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              data-testid="button-next-week"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-2 text-center border-r last:border-r-0 ${
                isToday(day) ? "bg-primary/5" : ""
              }`}
            >
              <div className={`text-xs font-medium ${
                isToday(day) ? "text-primary" : "text-muted-foreground"
              }`}>
                {format(day, "EEE")}
              </div>
              <div className={`text-sm font-bold ${
                isToday(day) ? "text-primary" : ""
              }`}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
        
        <ScrollArea className="h-64">
          <div className="grid grid-cols-7">
            {weekDays.map((day) => {
              const dayTasks = getTasksForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 border-r last:border-r-0 min-h-[240px] ${
                    isToday(day) ? "bg-primary/5" : ""
                  }`}
                  data-testid={`scheduler-day-${format(day, "yyyy-MM-dd")}`}
                >
                  <div className="space-y-1">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-2 rounded border text-xs cursor-pointer hover:shadow-sm transition-shadow ${getStatusColor(task.status)}`}
                        data-testid={`scheduler-task-${task.id}`}
                      >
                        <div className="font-medium truncate mb-1" title={task.title}>
                          {task.title}
                        </div>
                        
                        <div className="flex items-center gap-1 mb-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-1 py-0 ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground truncate">
                          {task.customerName}
                        </div>
                        
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(task.dueDate), "HH:mm")}
                          </div>
                        )}
                        
                        {task.assignees && task.assignees.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">
                            👤 {task.assignees[0].name}
                            {task.assignees.length > 1 && ` +${task.assignees.length - 1}`}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {dayTasks.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        {t('msg.noTasks')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}