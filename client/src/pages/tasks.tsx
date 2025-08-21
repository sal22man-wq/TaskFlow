import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskWithAssignees } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, AlertCircle, RefreshCw } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useErrorHandler } from "@/lib/error-handler";
import { ErrorBoundary, ComponentErrorFallback } from "@/components/error/error-boundary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function TasksContent() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "dueDate">("newest");
  const { t } = useLanguage();
  const { handleError } = useErrorHandler();

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
    if (activeFilter === "all") return true;
    return task.status === activeFilter;
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
    <div className="p-4">
      <h2 className="text-xl font-medium mb-4" data-testid="text-tasks-title">
        {t('nav.tasks')}
      </h2>

      <div className="flex items-center justify-between mb-4">
        <TaskFilters 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortOrder} onValueChange={(value: "newest" | "oldest" | "dueDate") => setSortOrder(value)}>
            <SelectTrigger className="w-32">
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

      <div className="space-y-3">
        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </>
        ) : sortedTasks.length > 0 ? (
          sortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground" data-testid="text-no-filtered-tasks">
            {activeFilter === "all" 
              ? "لا توجد مهام. أنشئ مهمتك الأولى للبدء."
              : `لا توجد مهام ${activeFilter === 'pending' ? 'في الانتظار' : activeFilter === 'in_progress' ? 'قيد التنفيذ' : 'مكتملة'}.`
            }
          </div>
        )}
      </div>
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
