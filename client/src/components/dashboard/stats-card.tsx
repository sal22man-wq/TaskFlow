interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: "primary" | "secondary" | "success" | "error";
  testId?: string;
}

export function StatsCard({ title, value, icon, color, testId }: StatsCardProps) {
  const colorClasses = {
    primary: "bg-blue-50/60 border-blue-200/60 text-blue-900 hover:bg-blue-50/80",
    secondary: "bg-purple-50/60 border-purple-200/60 text-purple-900 hover:bg-purple-50/80", 
    success: "bg-green-50/60 border-green-200/60 text-green-900 hover:bg-green-50/80",
    error: "bg-red-50/60 border-red-200/60 text-red-900 hover:bg-red-50/80",
  };

  return (
    <div className={`stat-card ${colorClasses[color]} border rounded-lg p-3 hover:shadow-md transition-all duration-200 hover:scale-[1.02] backdrop-blur-sm`} data-testid={testId}>
      <div className="flex items-center justify-between h-full">
        <div className="flex-1">
          <p className="text-xs font-medium opacity-80 line-clamp-1" data-testid={`${testId}-title`}>{title}</p>
          <p className="text-lg sm:text-xl font-bold leading-tight mt-1" data-testid={`${testId}-value`}>
            {value}
          </p>
        </div>
        <div className="text-lg sm:text-xl opacity-70 ml-2" data-testid={`${testId}-icon`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
