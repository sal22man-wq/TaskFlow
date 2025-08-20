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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground" data-testid={`${testId}-title`}>{title}</p>
          <p className={`text-2xl font-bold ${colorClasses[color]}`} data-testid={`${testId}-value`}>
            {value}
          </p>
        </div>
        <div className={`text-xl ${colorClasses[color]}`} data-testid={`${testId}-icon`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
