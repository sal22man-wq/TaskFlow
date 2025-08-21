import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XCircle, AlertTriangle, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface CancelTaskModalProps {
  taskId: string;
  taskTitle: string;
  customerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelTaskModal({
  taskId,
  taskTitle,
  customerName,
  open,
  onOpenChange,
}: CancelTaskModalProps) {
  const [cancelledBy, setCancelledBy] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: async (data: { cancelledBy: string; cancellationReason: string }) => {
      return apiRequest("PUT", `/api/tasks/${taskId}/cancel`, {
        cancelledBy: data.cancelledBy,
        cancellationReason: data.cancellationReason,
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إلغاء المهمة بنجاح",
        description: "تم إلغاء المهمة وإرسال إشعار للمكلفين والعميل",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      onOpenChange(false);
      setCancelledBy("");
      setCancellationReason("");
    },
    onError: (error: any) => {
      toast({
        title: "فشل في إلغاء المهمة",
        description: error.message || "حدث خطأ أثناء إلغاء المهمة",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelledBy || !cancellationReason.trim()) {
      toast({
        title: "بيانات مفقودة",
        description: "يرجى تحديد من طلب الإلغاء وسبب الإلغاء",
        variant: "destructive",
      });
      return;
    }

    cancelMutation.mutate({
      cancelledBy,
      cancellationReason: cancellationReason.trim(),
    });
  };

  const getCancelledByLabel = (value: string) => {
    switch (value) {
      case "customer": return "طلب العميل";
      case "admin": return "قرار إداري";
      case "system": return "أسباب تقنية";
      default: return value;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="bg-red-100 p-2 rounded-full">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            إلغاء المهمة
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Info */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">اسم المهمة</Label>
              <p className="text-sm font-semibold text-foreground">{taskTitle}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">اسم العميل</Label>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">{customerName}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-800">
                  تحذير: إلغاء المهمة نهائي ولا يمكن التراجع عنه
                </p>
                <p className="text-xs text-red-700">
                  سيتم إرسال إشعار الإلغاء للعميل والمكلفين وتحديث النظام
                </p>
              </div>
            </div>
          </div>

          {/* Cancelled By */}
          <div className="space-y-2">
            <Label htmlFor="cancelledBy" className="text-sm font-medium">
              من طلب إلغاء المهمة؟ *
            </Label>
            <Select value={cancelledBy} onValueChange={setCancelledBy}>
              <SelectTrigger className="w-full" data-testid="select-cancelled-by">
                <SelectValue placeholder="اختر من طلب الإلغاء" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">العميل طلب الإلغاء</SelectItem>
                <SelectItem value="admin">قرار إداري من الشركة</SelectItem>
                <SelectItem value="system">أسباب تقنية أو ظروف طارئة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="cancellationReason" className="text-sm font-medium">
              سبب الإلغاء *
            </Label>
            <Textarea
              id="cancellationReason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="اذكر السبب التفصيلي لإلغاء هذه المهمة..."
              className="min-h-[120px] resize-none"
              required
              data-testid="textarea-cancellation-reason"
            />
            <p className="text-xs text-muted-foreground">
              سيتم تسجيل هذا السبب في النظام وإرساله في إشعار الإلغاء
            </p>
          </div>

          {/* Additional Info based on cancelled by */}
          {cancelledBy === "customer" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>ملاحظة:</strong> عند إلغاء المهمة بناءً على طلب العميل، يُفضل التأكد من سبب الإلغاء 
                وتسجيل أي ملاحظات مهمة لتحسين الخدمة مستقبلاً.
              </p>
            </div>
          )}

          {cancelledBy === "admin" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                <strong>ملاحظة:</strong> الإلغاء الإداري يتطلب موافقة من المشرف أو الإدارة. 
                تأكد من توثيق الأسباب بوضوح.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={cancelMutation.isPending}
              data-testid="button-cancel-cancellation"
            >
              تراجع
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={cancelMutation.isPending}
              className="min-w-[120px]"
              data-testid="button-confirm-cancellation"
            >
              {cancelMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الإلغاء...
                </div>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  إلغاء المهمة نهائياً
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}