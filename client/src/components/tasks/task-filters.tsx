import { Button } from "@/components/ui/button";

interface TaskFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function TaskFilters({ activeFilter, onFilterChange }: TaskFiltersProps) {
  const filters = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "start", label: "Started" },
    { key: "complete", label: "Complete" },
  ];

  return (
    <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
      {filters.map(({ key, label }) => (
        <Button
          key={key}
          variant={activeFilter === key ? "default" : "secondary"}
          size="sm"
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap touch-manipulation ${
            activeFilter === key
              ? "bg-primary text-primary-foreground"
              : "bg-surface-variant text-on-surface hover:bg-surface-variant/80"
          }`}
          onClick={() => onFilterChange(key)}
          data-testid={`filter-${key}`}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
