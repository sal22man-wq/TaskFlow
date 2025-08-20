import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskWithAssignees } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/use-language";

export default function Tasks() {
  const [activeFilter, setActiveFilter] = useState("all");
  const { t } = useLanguage();

  const { data: tasks, isLoading } = useQuery<TaskWithAssignees[]>({
    queryKey: ["/api/tasks"],
  });

  const filteredTasks = tasks?.filter((task) => {
    if (activeFilter === "all") return true;
    return task.status === activeFilter;
  }) || [];

  return (
    <div className="p-4">
      <h2 className="text-xl font-medium mb-4" data-testid="text-tasks-title">
        {t('nav.tasks')}
      </h2>

      <TaskFilters 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter} 
      />

      <div className="space-y-3">
        {isLoading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
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
