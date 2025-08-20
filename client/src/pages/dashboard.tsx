import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/stats-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { TaskCard } from "@/components/tasks/task-card";
import { TeamMemberCard } from "@/components/team/team-member-card";
import { Button } from "@/components/ui/button";
import { TaskWithAssignee, TeamMember } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<TaskWithAssignee[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: teamMembers, isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const recentTasks = tasks?.slice(0, 3) || [];
  const topTeamMembers = teamMembers?.slice(0, 2) || [];

  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <section className="p-4">
        <h2 className="text-xl font-medium mb-4 text-on-surface" data-testid="text-dashboard-title">
          Dashboard Overview
        </h2>
        
        {/* Stats Cards Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {statsLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Active Tasks"
                value={(stats as any)?.activeTasks || 0}
                icon="📋"
                color="primary"
                testId="stat-active-tasks"
              />
              <StatsCard
                title="Team Members"
                value={(stats as any)?.teamMembers || 0}
                icon="👥"
                color="secondary"
                testId="stat-team-members"
              />
              <StatsCard
                title="Completed"
                value={(stats as any)?.completed || 0}
                icon="✅"
                color="success"
                testId="stat-completed"
              />
              <StatsCard
                title="Overdue"
                value={(stats as any)?.overdue || 0}
                icon="⚠️"
                color="error"
                testId="stat-overdue"
              />
            </>
          )}
        </div>

        <QuickActions />
      </section>

      {/* Recent Tasks */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium" data-testid="text-recent-tasks-title">Recent Tasks</h3>
          <Link href="/tasks">
            <Button variant="ghost" size="sm" className="text-primary" data-testid="link-view-all-tasks">
              View All
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {tasksLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </>
          ) : recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-tasks">
              No recent tasks
            </div>
          )}
        </div>
      </section>

      {/* Team Members */}
      <section className="p-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium" data-testid="text-team-members-title">Team Members</h3>
          <Link href="/team">
            <Button variant="ghost" size="sm" className="text-primary" data-testid="link-view-all-team">
              View All
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {teamLoading ? (
            <>
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </>
          ) : topTeamMembers.length > 0 ? (
            topTeamMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-team-members">
              No team members found
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
