interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: "primary" | "secondary" | "success" | "error";
  testId?: string;
}

export function StatsCard({ title, value, icon, color, testId }: StatsCardProps) {
  const colorClasses = {
    primary: "text-primary",
    secondary: "text-secondary", 
    success: "text-success",
    error: "text-error",
  };

  return (
    <div className="stat-card" data-testid={testId}>
      <div className="flex items-center justify-center gap-3 h-full p-4">
        <div className={`text-3xl ${colorClasses[color]} flex-shrink-0`} data-testid={`${testId}-icon`}>
          {icon}
        </div>
        <div className="flex-1 text-center">
          <p className="text-sm text-muted-foreground mb-1" data-testid={`${testId}-title`}>{title}</p>
          <p className={`text-2xl font-bold ${colorClasses[color]}`} data-testid={`${testId}-value`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
