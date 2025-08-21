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
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className={`text-5xl mb-2 ${colorClasses[color]} drop-shadow-sm`} data-testid={`${testId}-icon`}>
          {icon}
        </div>
        <p className="text-sm text-muted-foreground mb-1 font-medium" data-testid={`${testId}-title`}>{title}</p>
        <p className={`text-2xl font-bold ${colorClasses[color]} leading-none`} data-testid={`${testId}-value`}>
          {value}
        </p>
      </div>
    </div>
  );
}
