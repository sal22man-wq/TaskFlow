import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, User } from "lucide-react";
import { TaskWithAssignees } from "@shared/schema";
import { format, isToday, isTomorrow, addDays } from "date-fns";
import { useLanguage } from "@/hooks/use-language";

export function UpcomingSchedule() {
  const { t } = useLanguage();
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
    if (isToday(date)) return "اليوم";
    if (isTomorrow(date)) return "غداً";
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "complete": return "bg-green-100 text-green-800 border-green-300";
      case "start": return "bg-blue-100 text-blue-800 border-blue-300";
      case "pending": return "bg-orange-100 text-orange-800 border-orange-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-secondary/10 to-primary/10 pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold">
          <div className="bg-secondary/20 p-2 rounded-full">
            <Clock className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <div>{t('dashboard.upcomingSchedule')}</div>
            <div className="text-sm font-normal text-muted-foreground">
              {upcomingTasks.length} مهمة قادمة في الأسبوع المقبل
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-4">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="group relative overflow-hidden p-4 rounded-xl border border-border/50 hover:border-primary/30 bg-gradient-to-r from-background to-muted/20 hover:from-primary/5 hover:to-secondary/5 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-lg"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  data-testid={`upcoming-task-${task.id}`}
                >
                  {/* Priority Indicator */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    task.priority === 'high' ? 'bg-red-400' :
                    task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                  }`}></div>
                  
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 mt-1 p-2 rounded-full ${
                      isToday(new Date(task.dueDate!)) ? 'bg-red-100 text-red-600' :
                      isTomorrow(new Date(task.dueDate!)) ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <Calendar className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Title and Badges */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-base text-foreground leading-tight group-hover:text-primary transition-colors" data-testid={`upcoming-task-title-${task.id}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge 
                            variant={getPriorityColor(task.priority)} 
                            className="text-xs font-medium"
                          >
                            {task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚡' : '📋'} 
                            {t(`priority.${task.priority}`)}
                          </Badge>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(task.status)}`}>
                            {t(`status.${task.status}`)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Description */}
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                      
                      {/* Date and Time Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                          <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs text-muted-foreground">التاريخ</div>
                            <div className="text-sm font-medium truncate" data-testid={`upcoming-task-date-${task.id}`}>
                              {task.dueDate && getDateLabel(new Date(task.dueDate))}
                            </div>
                          </div>
                        </div>
                        
                        {task.dueDate && (
                          <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                            <Clock className="w-4 h-4 text-secondary flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs text-muted-foreground">الوقت</div>
                              <div className="text-sm font-medium">
                                {format(new Date(task.dueDate), "HH:mm")}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                          <User className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs text-muted-foreground">العميل</div>
                            <div className="text-sm font-medium truncate">{task.customerName}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Assignees */}
                      {task.assignees && task.assignees.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-muted-foreground">المُكلفون:</span>
                          <div className="flex flex-wrap gap-2">
                            {task.assignees.map((assignee, index) => (
                              <div key={assignee.id} className="flex items-center gap-1.5">
                                <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-white">
                                    {assignee.name.charAt(0)}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs px-2 py-1">
                                  {assignee.name}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Progress */}
                      {task.progress > 0 && (
                        <div className="bg-muted/20 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-foreground">التقدم</span>
                            <span className="text-sm font-bold text-primary">{task.progress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-primary via-secondary to-primary rounded-full h-full transition-all duration-700 ease-out relative"
                              style={{ width: `${task.progress}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"></div>
                </div>
              ))
            ) : (
              <div className="text-center py-12" data-testid="text-no-upcoming-tasks">
                <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">لا توجد مهام قادمة</h3>
                <p className="text-muted-foreground">{t('msg.noUpcomingTasks')}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}