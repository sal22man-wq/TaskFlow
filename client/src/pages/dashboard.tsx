import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/stats-card";
import { QuickActions } from "@/components/dashboard/quick-actions";

import { TeamMemberCard } from "@/components/team/team-member-card";
import { SchedulerWidget } from "@/components/scheduler/scheduler-widget";
import { UpcomingSchedule } from "@/components/scheduler/upcoming-schedule";
import { TeamPointsWidget } from "@/components/dashboard/team-points-widget";
import { Button } from "@/components/ui/button";
import { TeamMember } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";

export default function Dashboard() {
  const { t } = useLanguage();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: teamMembers, isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const topTeamMembers = teamMembers?.slice(0, 2) || [];

  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <section className="p-4">
        <h2 className="text-xl font-medium mb-4 text-on-surface" data-testid="text-dashboard-title">
          {t('dashboard.title')}
        </h2>
        
        {/* Unified Stats & Points Grid - More compact */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 mb-4 desktop-grid">
          {statsLoading ? (
            <>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title={t('stats.activeTasks')}
                value={(stats as any)?.activeTasks || 0}
                icon="📋"
                color="primary"
                testId="stat-active-tasks"
              />
              <StatsCard
                title={t('team.title')}
                value={(stats as any)?.teamMembers || 0}
                icon="👥"
                color="secondary"
                testId="stat-team-members"
              />
              <StatsCard
                title={t('stats.completed')}
                value={(stats as any)?.completed || 0}
                icon="✅"
                color="success"
                testId="stat-completed"
              />
              <StatsCard
                title={t('stats.overdue')}
                value={(stats as any)?.overdue || 0}
                icon="⚠️"
                color="error"
                testId="stat-overdue"
              />
              <StatsCard
                title="النقاط الإجمالية"
                value={0}
                icon="🏆"
                color="primary"
                testId="stat-total-points"
              />
              <StatsCard
                title="أفضل عضو"
                value={0}
                icon="⭐"
                color="secondary"
                testId="stat-top-performer"
              />
            </>
          )}
        </div>

        <QuickActions />
      </section>

      {/* Scheduler Section - Given More Space */}
      <section className="px-4 mb-6">
        <SchedulerWidget />
      </section>

      {/* Upcoming Schedule - Expanded */}
      <section className="px-4 mb-6">
        <UpcomingSchedule />
      </section>

      {/* Team Members */}
      <section className="p-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium" data-testid="text-team-members-title">{t('team.title')}</h3>
          <Link href="/team">
            <Button variant="ghost" size="sm" className="text-primary" data-testid="link-view-all-team">
              {t('common.viewAll')}
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
{t('msg.noTeamMembers')}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
