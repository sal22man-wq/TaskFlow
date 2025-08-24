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
    const colors = [
      "bg-blue-500", 
      "bg-green-500", 
      "bg-purple-500", 
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-rose-500"
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getCardBorderColor = (memberId: string) => {
    const colors = [
      'border-l-blue-500 bg-blue-50/30',
      'border-l-green-500 bg-green-50/30',
      'border-l-purple-500 bg-purple-50/30',
      'border-l-orange-500 bg-orange-50/30',
      'border-l-pink-500 bg-pink-50/30',
      'border-l-indigo-500 bg-indigo-50/30',
      'border-l-teal-500 bg-teal-50/30',
      'border-l-rose-500 bg-rose-50/30'
    ];
    const hash = memberId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
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
    <div className="bg-surface rounded-lg p-2 shadow-sm border border-surface-variant/50" data-testid={`team-member-card-${member.id}`}>
      <div className="flex items-center space-x-2">
        <div className={`w-8 h-8 ${getAvatarColor(member.name)} text-white rounded-full flex items-center justify-center font-medium text-sm`}>
          {member.avatar || member.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate" data-testid={`member-name-${member.id}`}>
            {member.name}
          </h4>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground truncate" data-testid={`member-role-${member.id}`}>
              {member.role}
            </p>
            <div className="flex items-center space-x-1">
              <div className={`w-1.5 h-1.5 ${getStatusColor(member.status)} rounded-full`}></div>
              <span className="text-xs text-muted-foreground" data-testid={`member-status-${member.id}`}>
                {getStatusLabel(member.status)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive-dark p-1 h-6 w-6"
              onClick={() => setShowDeleteDialog(true)}
              data-testid={`button-delete-member-${member.id}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary-dark p-1 h-6 w-6"
            data-testid={`button-member-details-${member.id}`}
          >
            <ChevronRight className="h-3 w-3" />
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
