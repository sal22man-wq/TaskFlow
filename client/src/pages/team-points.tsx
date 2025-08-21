import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, RotateCcw, Trophy, History, Award } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';

interface User {
  id: string;
  username: string;
  role: string;
  isApproved: string;
  isActive: string;
}

interface TeamMemberPoints {
  id: string;
  teamMemberId: string;
  points: number;
  totalEarned: number;
  lastUpdated: Date;
  teamMember: {
    id: string;
    name: string;
    role: string;
  };
}

interface PointsHistory {
  id: string;
  teamMemberId: string;
  action: 'earned' | 'reset';
  pointsChange: number;
  reason: string;
  taskId?: string;
  ratingId?: string;
  performedBy?: string;
  createdAt: Date;
  teamMember: {
    name: string;
  };
  performedByUser?: {
    username: string;
  };
}

export default function TeamPoints() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [addPointsForm, setAddPointsForm] = useState({
    teamMemberId: '',
    points: '',
    reason: ''
  });

  // جلب نقاط الفريق
  const { data: teamPoints = [], isLoading: pointsLoading } = useQuery<TeamMemberPoints[]>({
    queryKey: ['/api/team-points'],
    enabled: !!user
  });

  // جلب تاريخ النقاط
  const { data: pointsHistory = [], isLoading: historyLoading } = useQuery<PointsHistory[]>({
    queryKey: ['/api/points-history'],
    enabled: !!user && showHistoryDialog
  });

  // إضافة نقاط
  const addPointsMutation = useMutation({
    mutationFn: async (data: { teamMemberId: string; points: number; reason: string }) => {
      return await apiRequest(`/api/team-points/${data.teamMemberId}/add`, 'POST', {
        points: data.points, 
        reason: data.reason 
      });
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم إضافة النقاط بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/team-points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points-history'] });
      setShowAddDialog(false);
      setAddPointsForm({ teamMemberId: '', points: '', reason: '' });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة النقاط",
        variant: "destructive",
      });
    }
  });

  // تصفير نقاط عضو واحد
  const resetMemberPointsMutation = useMutation({
    mutationFn: async (teamMemberId: string) => {
      return await apiRequest(`/api/team-points/${teamMemberId}/reset`, 'POST');
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تصفير نقاط العضو بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/team-points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points-history'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تصفير النقاط",
        variant: "destructive",
      });
    }
  });

  // تصفير جميع النقاط
  const resetAllPointsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/team-points/reset-all', 'POST');
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تصفير جميع النقاط بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/team-points'] });
      queryClient.invalidateQueries({ queryKey: ['/api/points-history'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تصفير جميع النقاط",
        variant: "destructive",
      });
    }
  });

  const handleAddPoints = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addPointsForm.teamMemberId || !addPointsForm.points || !addPointsForm.reason) {
      toast({
        title: "خطأ",
        description: "جميع الحقول مطلوبة",
        variant: "destructive",
      });
      return;
    }

    const points = parseInt(addPointsForm.points);
    if (isNaN(points) || points <= 0) {
      toast({
        title: "خطأ",
        description: "عدد النقاط يجب أن يكون رقمًا موجبًا",
        variant: "destructive",
      });
      return;
    }

    addPointsMutation.mutate({
      teamMemberId: addPointsForm.teamMemberId,
      points,
      reason: addPointsForm.reason
    });
  };

  const formatPointsChange = (change: number) => {
    return change > 0 ? `+${change}` : change.toString();
  };

  const getActionBadgeVariant = (action: string) => {
    return action === 'earned' ? 'default' : 'secondary';
  };

  const getActionText = (action: string) => {
    return action === 'earned' ? 'حصل على' : 'تم تصفير';
  };

  if (!user || (user as any).role !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              عذراً، هذه الصفحة متاحة فقط للمديرين
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="team-points-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
            نقاط الفريق
          </h1>
          <p className="text-muted-foreground">
            إدارة نقاط المكافآت لأعضاء الفريق
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowHistoryDialog(true)}
            variant="outline"
            data-testid="button-view-history"
          >
            <History className="h-4 w-4 mr-2" />
            عرض التاريخ
          </Button>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-points">
                <Plus className="h-4 w-4 mr-2" />
                إضافة نقاط
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة نقاط لعضو الفريق</DialogTitle>
                <DialogDescription>
                  قم بإضافة نقاط مكافأة لعضو من أعضاء الفريق
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddPoints} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamMember">عضو الفريق</Label>
                  <select
                    id="teamMember"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={addPointsForm.teamMemberId}
                    onChange={(e) => setAddPointsForm({...addPointsForm, teamMemberId: e.target.value})}
                    data-testid="select-team-member"
                  >
                    <option value="">اختر عضو الفريق</option>
                    {teamPoints?.map((point: TeamMemberPoints) => (
                      <option key={point.teamMemberId} value={point.teamMemberId}>
                        {point.teamMember.name} - {point.teamMember.role}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="points">عدد النقاط</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    value={addPointsForm.points}
                    onChange={(e) => setAddPointsForm({...addPointsForm, points: e.target.value})}
                    placeholder="أدخل عدد النقاط"
                    data-testid="input-points"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">السبب</Label>
                  <Textarea
                    id="reason"
                    value={addPointsForm.reason}
                    onChange={(e) => setAddPointsForm({...addPointsForm, reason: e.target.value})}
                    placeholder="أدخل سبب منح النقاط"
                    data-testid="textarea-reason"
                  />
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={addPointsMutation.isPending}
                    data-testid="button-submit-add-points"
                  >
                    {addPointsMutation.isPending ? 'جاري الإضافة...' : 'إضافة النقاط'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" data-testid="button-reset-all">
                <RotateCcw className="h-4 w-4 mr-2" />
                تصفير جميع النقاط
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد تصفير جميع النقاط</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من أنك تريد تصفير جميع نقاط أعضاء الفريق؟ هذا الإجراء لا يمكن التراجع عنه.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => resetAllPointsMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-reset-all"
                >
                  تصفير الكل
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Team Points Grid */}
      {pointsLoading ? (
        <div className="text-center py-8">
          <p>جاري تحميل النقاط...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teamPoints?.map((point: TeamMemberPoints) => (
            <Card key={point.teamMemberId} data-testid={`card-points-${point.teamMemberId}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{point.teamMember.name}</CardTitle>
                    <CardDescription>{point.teamMember.role}</CardDescription>
                  </div>
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">النقاط الحالية:</span>
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {point.points} نقطة
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">إجمالي النقاط المكتسبة:</span>
                    <span className="text-sm font-medium">{point.totalEarned}</span>
                  </div>
                  
                  {point.lastUpdated && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">آخر تحديث:</span>
                      <span className="text-xs">
                        {format(new Date(point.lastUpdated), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        data-testid={`button-reset-${point.teamMemberId}`}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        تصفير النقاط
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد تصفير النقاط</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من أنك تريد تصفير نقاط {point.teamMember.name}؟ هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => resetMemberPointsMutation.mutate(point.teamMemberId)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          data-testid={`button-confirm-reset-${point.teamMemberId}`}
                        >
                          تصفير النقاط
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Points History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تاريخ النقاط</DialogTitle>
            <DialogDescription>
              عرض جميع عمليات النقاط والمكافآت
            </DialogDescription>
          </DialogHeader>
          
          {historyLoading ? (
            <div className="text-center py-8">
              <p>جاري تحميل التاريخ...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pointsHistory?.map((entry: PointsHistory) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{entry.teamMember.name}</p>
                        <p className="text-sm text-muted-foreground">{entry.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant={getActionBadgeVariant(entry.action)}>
                          {getActionText(entry.action)}
                        </Badge>
                        <span className={`font-bold ${entry.pointsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPointsChange(entry.pointsChange)} نقطة
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(entry.createdAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                      {entry.performedByUser && (
                        <p className="text-xs text-muted-foreground">
                          بواسطة: {entry.performedByUser.username}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}