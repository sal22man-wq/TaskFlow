import { TeamMember } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronRight, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface TeamMemberCardProps {
  member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
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

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/team-members/${member.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete team member');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف عضو الفريق ${member.name} بنجاح`,
      });
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "حدث خطأ أثناء حذف عضو الفريق",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMemberMutation.mutate();
  };

  // Check if current user is admin
  const isAdmin = user && typeof user === 'object' && user !== null && 'role' in user ? (user as any).role === 'admin' : false;

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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive-dark p-2 h-auto"
              onClick={() => setShowDeleteDialog(true)}
              data-testid={`button-delete-member-${member.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف عضو الفريق</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف عضو الفريق "{member.name}"؟ 
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMemberMutation.isPending}
            >
              {deleteMemberMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
