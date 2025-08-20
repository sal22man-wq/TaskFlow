import { TeamMember } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface TeamMemberCardProps {
  member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "availability-available";
      case "busy":
        return "availability-busy";
      default:
        return "availability-offline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "متاح";
      case "busy":
        return "مشغول";
      default:
        return "غير متصل";
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ["bg-primary", "bg-secondary", "bg-success", "bg-warning"];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="bg-surface rounded-lg p-4 shadow-sm border border-surface-variant/50" data-testid={`team-member-card-${member.id}`}>
      <div className="flex items-center space-x-3">
        <div className={`w-12 h-12 ${getAvatarColor(member.name)} text-white rounded-full flex items-center justify-center font-medium`}>
          {member.avatar || member.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-base" data-testid={`member-name-${member.id}`}>
            {member.name}
          </h4>
          <p className="text-sm text-muted-foreground" data-testid={`member-role-${member.id}`}>
            {member.role}
          </p>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-xs text-muted-foreground" data-testid={`member-active-tasks-${member.id}`}>
              {member.activeTasks} مهمة نشطة
            </span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 ${getStatusColor(member.status)} rounded-full`}></div>
              <span className="text-xs text-muted-foreground" data-testid={`member-status-${member.id}`}>
                {getStatusLabel(member.status)}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary-dark p-0 h-auto"
          data-testid={`button-member-details-${member.id}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
