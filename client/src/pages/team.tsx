import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TeamMemberCard } from "@/components/team/team-member-card";
import { AddMemberForm } from "@/components/team/add-member-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TeamMember } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Trash2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Team() {
  const [showAddMember, setShowAddMember] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teamMembers, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  // Check if current user is admin
  const isAdmin = user && typeof user === 'object' && user !== null && 'role' in user ? (user as any).role === 'admin' : false;

  // Cleanup default members mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/cleanup-default-members', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to cleanup default members');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      toast({
        title: "تم التنظيف بنجاح",
        description: `${data.message} (${data.cleaned} عضو)`,
      });
      setShowCleanupDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التنظيف",
        description: error.message || "حدث خطأ أثناء تنظيف الأعضاء الافتراضيين",
        variant: "destructive",
      });
    },
  });

  const handleCleanup = () => {
    cleanupMutation.mutate();
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium" data-testid="text-team-title">
          {t('team.title')}
        </h2>
        <div className="flex items-center gap-2">
          {isAdmin && teamMembers && teamMembers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCleanupDialog(true)}
              disabled={cleanupMutation.isPending}
              data-testid="button-cleanup-defaults"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {cleanupMutation.isPending ? "جاري التنظيف..." : "تنظيف الأعضاء الافتراضيين"}
            </Button>
          )}
          <Button
            onClick={() => setShowAddMember(true)}
            size="sm"
            data-testid="button-add-member"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {t('team.addMember')}
          </Button>
        </div>
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
            لا يوجد أعضاء فريق. أضف عضو الفريق الأول للبدء.
          </div>
        )}
      </div>

      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="sm:max-w-md">
          <AddMemberForm onSuccess={() => setShowAddMember(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تنظيف الأعضاء الافتراضيين</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف جميع الأعضاء الافتراضيين/التجريبيين من الفريق؟
              سيتم حذف الأعضاء الذين لا يملكون حسابات مستخدمين مرتبطة والأسماء النموذجية.
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCleanup}
              className="bg-destructive hover:bg-destructive/90"
              disabled={cleanupMutation.isPending}
            >
              {cleanupMutation.isPending ? "جاري التنظيف..." : "تنظيف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
