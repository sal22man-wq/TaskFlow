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
    <div className="stat-card responsive-padding" data-testid={testId}>
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground truncate responsive-text" data-testid={`${testId}-title`}>{title}</p>
          <p className={`text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold ${colorClasses[color]} truncate`} data-testid={`${testId}-value`}>
            {value}
          </p>
        </div>
        <div className={`text-lg sm:text-xl lg:text-2xl xl:text-3xl ${colorClasses[color]} flex-shrink-0 ml-2`} data-testid={`${testId}-icon`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
