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
    <Card className="overflow-hidden shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="bg-primary/20 p-2 rounded-full">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div>{t('dashboard.weeklySchedule')}</div>
              <div className="text-xs font-normal text-muted-foreground">
                {scheduledTasks.length} مهمة مجدولة هذا الأسبوع
              </div>
            </div>
          </CardTitle>
          
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              className="hover:bg-primary/10"
              data-testid="button-prev-week"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-sm font-medium px-3 py-1 bg-white/50 rounded" data-testid="text-current-week">
              {format(weekStart, "d MMM")} - {format(weekEnd, "d MMM yyyy")}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              className="hover:bg-primary/10"
              data-testid="button-next-week"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Days Header - Enhanced */}
        <div className="grid grid-cols-7 bg-muted/30 border-b-2">
          {weekDays.map((day) => {
            const dayTasks = getTasksForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={`relative p-3 text-center border-r last:border-r-0 transition-all duration-200 ${
                  isToday(day) 
                    ? "bg-primary/10 border-primary/20" 
                    : "hover:bg-muted/20"
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${
                  isToday(day) ? "text-primary" : "text-muted-foreground"
                }`}>
                  {format(day, "EEE")}
                </div>
                <div className={`text-lg font-bold mb-1 ${
                  isToday(day) ? "text-primary" : "text-foreground"
                }`}>
                  {format(day, "d")}
                </div>
                {dayTasks.length > 0 && (
                  <div className="flex justify-center">
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-2 py-0.5 bg-primary/20 text-primary border-0"
                    >
                      {dayTasks.length}
                    </Badge>
                  </div>
                )}
                {isToday(day) && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-primary rounded-t-full"></div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Tasks Grid - Enhanced */}
        <ScrollArea className="h-72 lg:h-80">
          <div className="grid grid-cols-7 min-h-full">
            {weekDays.map((day) => {
              const dayTasks = getTasksForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`relative p-2 border-r last:border-r-0 min-h-[280px] transition-colors duration-200 ${
                    isToday(day) 
                      ? "bg-gradient-to-b from-primary/5 to-transparent" 
                      : "hover:bg-muted/20"
                  }`}
                  data-testid={`scheduler-day-${format(day, "yyyy-MM-dd")}`}
                >
                  <div className="space-y-2">
                    {dayTasks.map((task, index) => (
                      <div
                        key={task.id}
                        className={`group relative p-2.5 rounded-lg border-l-4 text-xs cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${getStatusColor(task.status)} ${
                          task.priority === 'high' ? 'border-l-red-400' :
                          task.priority === 'medium' ? 'border-l-yellow-400' : 
                          'border-l-green-400'
                        }`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                        data-testid={`scheduler-task-${task.id}`}
                      >
                        {/* Task Title */}
                        <div className="font-semibold text-foreground mb-1.5 leading-tight" title={task.title}>
                          {task.title.length > 25 ? `${task.title.slice(0, 25)}...` : task.title}
                        </div>
                        
                        {/* Priority & Status */}
                        <div className="flex items-center gap-1 mb-2">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0.5 font-medium ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚡' : '📋'} {task.priority}
                          </Badge>
                        </div>
                        
                        {/* Customer */}
                        <div className="text-muted-foreground mb-2 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-secondary rounded-full flex-shrink-0"></span>
                          <span className="truncate">{task.customerName}</span>
                        </div>
                        
                        {/* Time */}
                        {task.dueDate && (
                          <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="font-medium">{format(new Date(task.dueDate), "HH:mm")}</span>
                          </div>
                        )}
                        
                        {/* Assignees */}
                        {task.assignees && task.assignees.length > 0 && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-[8px] font-bold text-primary">
                                {task.assignees[0].name.charAt(0)}
                              </span>
                            </div>
                            <span className="text-[10px] truncate">
                              {task.assignees[0].name}
                              {task.assignees.length > 1 && (
                                <span className="bg-primary/10 text-primary px-1 rounded ml-1">
                                  +{task.assignees.length - 1}
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        
                        {/* Progress Bar */}
                        {task.progress > 0 && (
                          <div className="mt-2 pt-2 border-t border-muted/30">
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-muted-foreground">التقدم</span>
                              <span className="font-bold text-primary">{task.progress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-primary to-secondary rounded-full h-full transition-all duration-500"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Hover Effect */}
                        <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </div>
                    ))}
                    
                    {dayTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mb-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          لا توجد مهام
                        </div>
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