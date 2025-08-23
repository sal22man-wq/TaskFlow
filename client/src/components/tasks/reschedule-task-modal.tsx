import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RescheduleTaskModalProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RescheduleTaskModal({
  taskId,
  open,
  onOpenChange,
}: RescheduleTaskModalProps) {
  const [newDueDate, setNewDueDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const rescheduleMutation = useMutation({
    mutationFn: async (data: { newDueDate: string; rescheduleReason: string }) => {
      return apiRequest("PUT", `/api/tasks/${taskId}/reschedule`, {
        newDueDate: data.newDueDate,
        rescheduleReason: data.rescheduleReason,
      });
    },
    onSuccess: () => {
      toast({
        title: "تم تأجيل المهمة بنجاح",
        description: "تم تحديث موعد المهمة وإرسال إشعار للمكلفين",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      onOpenChange(false);
      setNewDueDate("");
      setRescheduleReason("");
    },
    onError: (error: any) => {
      toast({
        title: "فشل في تأجيل المهمة",
        description: error.message || "حدث خطأ أثناء تأجيل المهمة",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDueDate || !rescheduleReason.trim()) {
      toast({
        title: "بيانات مفقودة",
        description: "يرجى تحديد الموعد الجديد وسبب التأجيل",
        variant: "destructive",
      });
      return;
    }

    const newDate = new Date(newDueDate);
    const currentDate = new Date(currentDueDate);
    
    if (newDate <= currentDate) {
      toast({
        title: "موعد غير صالح",
        description: "يجب أن يكون الموعد الجديد بعد الموعد الحالي",
        variant: "destructive",
      });
      return;
    }

    rescheduleMutation.mutate({
      newDueDate: newDate.toISOString(),
      rescheduleReason: rescheduleReason.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="bg-blue-100 p-2 rounded-full">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            تأجيل المهمة
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Info */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">اسم المهمة</Label>
              <p className="text-sm font-semibold text-foreground">{taskTitle}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">الموعد الحالي</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">
                    {format(new Date(currentDueDate), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">عدد مرات التأجيل</Label>
                <div className="flex items-center gap-2 mt-1">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">{rescheduleCount} مرة</span>
                </div>
              </div>
            </div>
          </div>

          {/* New Due Date */}
          <div className="space-y-2">
            <Label htmlFor="newDueDate" className="text-sm font-medium">
              الموعد الجديد *
            </Label>
            <Input
              id="newDueDate"
              type="datetime-local"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full"
              required
              data-testid="input-new-due-date"
            />
            <p className="text-xs text-muted-foreground">
              يجب أن يكون الموعد الجديد بعد الموعد الحالي
            </p>
          </div>

          {/* Reschedule Reason */}
          <div className="space-y-2">
            <Label htmlFor="rescheduleReason" className="text-sm font-medium">
              سبب التأجيل *
            </Label>
            <Textarea
              id="rescheduleReason"
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              placeholder="اذكر السبب وراء تأجيل هذه المهمة..."
              className="min-h-[100px] resize-none"
              required
              data-testid="textarea-reschedule-reason"
            />
            <p className="text-xs text-muted-foreground">
              سيتم إرسال هذا السبب في إشعار التأجيل للمكلفين والعميل
            </p>
          </div>

          {/* Warning for multiple reschedules */}
          {rescheduleCount >= 2 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800">
                    تحذير: تم تأجيل هذه المهمة عدة مرات
                  </p>
                  <p className="text-xs text-amber-700">
                    يُفضل مراجعة جدولة المهمة أو اتخاذ إجراءات لضمان إتمامها في الموعد الجديد
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={rescheduleMutation.isPending}
              data-testid="button-cancel-reschedule"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={rescheduleMutation.isPending}
              className="min-w-[120px]"
              data-testid="button-confirm-reschedule"
            >
              {rescheduleMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري التأجيل...
                </div>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  تأجيل المهمة
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}