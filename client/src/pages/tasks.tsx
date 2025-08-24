import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { TaskWithAssignees } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, AlertCircle, RefreshCw, Search, X, ChevronRight } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useErrorHandler } from "@/lib/error-handler";
import { ErrorBoundary, ComponentErrorFallback } from "@/components/error/error-boundary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

function TasksContent() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "dueDate">("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignees | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const { t } = useLanguage();
  const { handleError } = useErrorHandler();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-500 text-white border-green-600"; // أخضر ممتلئ للمهام المكتملة
      case "start":
        return "bg-yellow-500 text-white border-yellow-600"; // أصفر ممتلئ للمهام التي بدأت
      case "cancelled":
        return "bg-red-500 text-white border-red-600";
      case "rescheduled":
        return "bg-purple-500 text-white border-purple-600";
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

  const getTaskBackgroundColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 border-l-green-500"; // خلفية خضراء فاتحة للمهام المكتملة
      case "start":
        return "bg-yellow-100 border-l-yellow-500"; // خلفية صفراء فاتحة للمهام التي بدأت
      case "cancelled":
        return "bg-red-100 border-l-red-500";
      case "rescheduled":
        return "bg-purple-100 border-l-purple-500";
      case "pending":
      default:
        return "bg-orange-100 border-l-red-500"; // خلفية برتقالية فاتحة مع حافة حمراء للمهام في الانتظار
    }
  };

  const { data: tasks, isLoading, error, refetch } = useQuery<TaskWithAssignees[]>({
    queryKey: ["/api/tasks"],
    retry: 2,
    retryDelay: 1000,
  });

  // Handle query errors
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('error.generic')}</p>
              <p className="text-sm mt-1 opacity-80">
                {error.message || t('error.network')}
              </p>
            </div>
            <Button 
              onClick={() => refetch()} 
              size="sm" 
              variant="outline"
              data-testid="button-retry-tasks"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {t('guidance.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const filteredTasks = tasks?.filter((task) => {
    // Filter by status
    if (activeFilter !== "all" && task.status !== activeFilter) return false;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.customerName?.toLowerCase().includes(query) ||
        task.customerPhone?.toLowerCase().includes(query) ||
        task.assignees?.some(assignee => 
          assignee.name.toLowerCase().includes(query)
        )
      );
    }
    
    return true;
  }) || [];

  // Sort tasks based on selected sort order
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortOrder) {
      case "newest":
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      case "oldest":
        return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
      case "dueDate":
        // Tasks without due date go to the end
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="p-4 space-y-6">
      {/* Header with Search */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-on-surface bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" data-testid="text-tasks-title">
            {t('nav.tasks')}
          </h1>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Select value={sortOrder} onValueChange={(value: "newest" | "oldest" | "dueDate") => setSortOrder(value)}>
              <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="الترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث أولاً</SelectItem>
                <SelectItem value="oldest">الأقدم أولاً</SelectItem>
                <SelectItem value="dueDate">تاريخ الاستحقاق</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="بحث في المهام (العنوان، الوصف، العميل، المكلف...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 h-14 text-base bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border-2 border-border/30 focus:border-primary/50 focus:bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            data-testid="input-search-tasks"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => setSearchQuery("")}
              data-testid="button-clear-search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Search Results Summary */}
        {searchQuery && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 px-3 py-2 rounded-lg border border-primary/10">
            <Search className="h-4 w-4 text-primary" />
            <span>
              تم العثور على <span className="font-semibold text-primary">{sortedTasks.length}</span> مهمة من أصل <span className="font-semibold">{tasks?.length || 0}</span>
              {searchQuery && <span className="font-medium"> للبحث: "<span className="text-primary">{searchQuery}</span>"</span>}
            </span>
          </div>
        )}

        {/* Filters */}
        <TaskFilters 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </>
        ) : sortedTasks.length > 0 ? (
          sortedTasks.map((task) => (
            <div
              key={task.id}
              className={`task-compact-card border-l-4 ${getTaskBackgroundColor(task.status)} backdrop-blur-sm rounded-lg border hover:shadow-md transition-all duration-200 p-3`}
              data-testid={`task-item-${task.id}`}
            >
              <div className="flex items-center justify-between">
                {/* Task Info Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Task Title & Status - Takes more space */}
                  <div className="md:col-span-5">
                    <div className="flex items-center gap-2 mb-1">
                      {task.taskNumber && (
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold">
                          #{task.taskNumber}
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-gray-600 line-clamp-1">
                        {task.description.substring(0, 80)}{task.description.length > 80 ? '...' : ''}
                      </p>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="md:col-span-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">العميل</div>
                    <div className="text-xs text-gray-900 font-medium line-clamp-1">
                      {task.customerName || 'غير محدد'}
                    </div>
                    {task.customerPhone && (
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {task.customerPhone}
                      </div>
                    )}
                  </div>

                  {/* Assignees & Due Date */}
                  <div className="md:col-span-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">المكلف</div>
                    <div className="text-xs text-gray-900 font-medium line-clamp-1">
                      {task.assignees && task.assignees.length > 0 ? (
                        <>
                          {task.assignees[0].name}
                          {task.assignees.length > 1 && (
                            <span className="text-gray-500"> +{task.assignees.length - 1}</span>
                          )}
                        </>
                      ) : (
                        'غير مُعين'
                      )}
                    </div>
                    {task.dueDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        استحقاق: {format(new Date(task.dueDate), "MMM dd")}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600 p-1 h-auto"
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskDetails(true);
                      }}
                      data-testid={`button-view-task-${task.id}`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-muted-foreground" data-testid="text-no-filtered-tasks">
            <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl p-8 border border-border/30">
              {searchQuery ? (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">لم يتم العثور على نتائج</h3>
                  <p>لا توجد مهام تطابق البحث "<span className="font-medium text-primary">{searchQuery}</span>"</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setSearchQuery("")}
                  >
                    مسح البحث
                  </Button>
                </>
              ) : (
                <>
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">
                    {activeFilter === "all" ? "لا توجد مهام" : "لا توجد مهام مطابقة"}
                  </h3>
                  <p>
                    {activeFilter === "all" 
                      ? "أنشئ مهمتك الأولى للبدء."
                      : `لا توجد مهام ${activeFilter === 'pending' ? 'في الانتظار' : activeFilter === 'start' ? 'قيد التنفيذ' : 'مكتملة'}.`
                    }
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open={showTaskDetails}
          onOpenChange={setShowTaskDetails}
        />
      )}
    </div>
  );
}

export default function Tasks() {
  return (
    <ErrorBoundary 
      fallback={({ error, resetError }) => (
        <ComponentErrorFallback
          error={error}
          resetError={resetError}
          componentName="صفحة المهام"
        />
      )}
    >
      <TasksContent />
    </ErrorBoundary>
  );
}
