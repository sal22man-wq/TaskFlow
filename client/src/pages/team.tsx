import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TeamMemberCard } from "@/components/team/team-member-card";
import { AddMemberForm } from "@/components/team/add-member-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TeamMember } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus } from "lucide-react";

export default function Team() {
  const [showAddMember, setShowAddMember] = useState(false);

  const { data: teamMembers, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium" data-testid="text-team-title">
          Team Members
        </h2>
        <Button
          onClick={() => setShowAddMember(true)}
          size="sm"
          data-testid="button-add-member"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </>
        ) : teamMembers && teamMembers.length > 0 ? (
          teamMembers.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground" data-testid="text-no-team-members">
            No team members found. Add your first team member to get started.
          </div>
        )}
      </div>

      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="sm:max-w-md">
          <AddMemberForm onSuccess={() => setShowAddMember(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
