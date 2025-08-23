import { TaskWithAssignees } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface ConflictingTask {
  task: TaskWithAssignees;
  assigneeName: string;
}

interface TimeConflictModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictingTasks: ConflictingTask[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function TimeConflictModal({
  open,
  onOpenChange,
  conflictingTasks,
  onConfirm,
  onCancel,
}: TimeConflictModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="bg-orange-100 p-2 rounded-full">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            تعارض في الأوقات
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert variant="destructive" className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              يوجد تعارض في الأوقات مع المهام الموجودة. الأشخاص التالية أسماؤهم مُكلفون بمهام أخرى في نفس الوقت:
            </AlertDescription>
          </Alert>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {conflictingTasks.map((conflict, index) => (
              <div
                key={`${conflict.task.id}-${index}`}
                className="border rounded-lg p-3 bg-red-50/50 border-red-200"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-1.5 rounded-full mt-0.5">
                    <User className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-red-900">
                      {conflict.assigneeName}
                    </div>
                    <div className="text-sm text-red-700 mt-1">
                      مُكلف بالمهمة: <span className="font-medium">{conflict.task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-red-600 mt-2">
                      <Clock className="w-3 h-3" />
                      {conflict.task.startTime && conflict.task.finishTime ? (
                        <span>
                          من {conflict.task.startTime} {conflict.task.startPeriod} 
                          إلى {conflict.task.finishTime} {conflict.task.finishPeriod}
                        </span>
                      ) : (
                        <span>وقت غير محدد</span>
                      )}
                      {conflict.task.dueDate && (
                        <span className="mr-2">
                          • {format(new Date(conflict.task.dueDate), "dd/MM/yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <span className="font-medium">هل تريد المتابعة؟</span>
              <br />
              يمكنك إنشاء المهمة رغم وجود التعارض، أو إلغاء العملية وتعديل التوقيت.
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onCancel();
              onOpenChange(false);
            }}
            className="flex-1"
          >
            إلغاء وتعديل التوقيت
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            متابعة رغم التعارض
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}