import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertTask, TeamMember, Customer, TaskWithAssignees } from "@shared/schema";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Calendar as CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import { TimeConflictModal } from "./time-conflict-modal";

interface CreateTaskFormProps {
  onSuccess: () => void;
}

export function CreateTaskForm({ onSuccess }: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [startTime, setStartTime] = useState("");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [finishTime, setFinishTime] = useState("");
  const [finishPeriod, setFinishPeriod] = useState("PM");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date>();
  
  // Collapsible sections state
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  // Time conflict modal state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingTasks, setConflictingTasks] = useState<Array<{task: TaskWithAssignees; assigneeName: string}>>([]);
  const [pendingTask, setPendingTask] = useState<InsertTask | null>(null);

  // Fetch customers from API
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: existingTasks } = useQuery<TaskWithAssignees[]>({
    queryKey: ["/api/tasks"],
  });

  // Function to convert time to 24-hour format for comparison
  const convertTo24Hour = (time: string, period: string) => {
    if (!time) return null;
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    
    if (period === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    return hour24 * 60 + (minutes || 0); // Convert to minutes for easy comparison
  };

  // Function to check for time conflicts
  const checkTimeConflicts = (newTask: InsertTask) => {
    if (!existingTasks || !teamMembers) return [];
    
    const newStartMinutes = convertTo24Hour(newTask.startTime || '', newTask.startPeriod || 'AM');
    const newEndMinutes = convertTo24Hour(newTask.finishTime || '', newTask.finishPeriod || 'PM');
    
    if (!newStartMinutes || !newEndMinutes) return [];

    const conflicts: Array<{task: TaskWithAssignees; assigneeName: string}> = [];
    
    // Check each assigned team member
    newTask.assigneeIds?.forEach(assigneeId => {
      const assignee = teamMembers.find(m => m.id === assigneeId);
      if (!assignee) return;
      
      // Check against all existing tasks for this assignee
      existingTasks.forEach(existingTask => {
        if (existingTask.status === 'complete' || existingTask.status === 'cancelled') {
          return; // Skip completed/cancelled tasks
        }
        
        // Check if this existing task is assigned to the same person
        const isAssignedToSamePerson = existingTask.assignees?.some(a => a.id === assigneeId);
        if (!isAssignedToSamePerson) return;
        
        // Check if it's the same date
        const existingDate = existingTask.dueDate ? new Date(existingTask.dueDate).toDateString() : '';
        const newDate = newTask.dueDate ? newTask.dueDate.toDateString() : '';
        
        if (existingDate !== newDate) return;
        
        const existingStartMinutes = convertTo24Hour(existingTask.startTime || '', existingTask.startPeriod || 'AM');
        const existingEndMinutes = convertTo24Hour(existingTask.finishTime || '', existingTask.finishPeriod || 'PM');
        
        if (!existingStartMinutes || !existingEndMinutes) return;
        
        // Check for time overlap
        const hasOverlap = (newStartMinutes < existingEndMinutes) && (newEndMinutes > existingStartMinutes);
        
        if (hasOverlap) {
          conflicts.push({
            task: existingTask,
            assigneeName: assignee.name
          });
        }
      });
    });
    
    return conflicts;
  };

  const createTaskMutation = useMutation({
    mutationFn: async (task: InsertTask) => {
      const response = await apiRequest("POST", "/api/tasks", task);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "تم إنشاء المهمة بنجاح",
        description: "تمت إضافة المهمة الجديدة لفريقك.",
      });
      // Reset form
      setTitle("");
      setDescription("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCustomerAddress("");
      setStartTime("");
      setStartPeriod("AM");
      setFinishTime("");
      setFinishPeriod("PM");
      setNotes("");
      setPriority("medium");
      setAssigneeIds([]);
      setDueDate(undefined);
      setPendingTask(null);
      setConflictingTasks([]);
      onSuccess();
    },
    onError: (error: Error) => {
      console.error("Task creation error:", error);
      toast({
        title: "خطأ في إنشاء المهمة",
        description: error.message || "حدثت مشكلة في إنشاء المهمة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !customerName.trim() || !startTime.trim() || !finishTime.trim()) {
      toast({
        title: "حقول مطلوبة مفقودة",
        description: "يرجى ملء جميع الحقول المطلوبة: العنوان، الوصف، اسم العميل، وقت البداية، ووقت الانتهاء.",
        variant: "destructive",
      });
      return;
    }

    const timeSchedule = `${startTime.trim()} ${startPeriod} - ${finishTime.trim()} ${finishPeriod}`;
    
    const task: InsertTask = {
      title: title.trim(),
      description: description.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      time: timeSchedule,
      startTime: startTime.trim(),
      startPeriod,
      finishTime: finishTime.trim(),
      finishPeriod,
      notes: notes.trim() || undefined,
      priority,
      assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
      dueDate: dueDate ? dueDate : undefined,
      status: "pending",
      progress: 0,
    };

    // Check for time conflicts before creating the task
    if (assigneeIds.length > 0 && dueDate) {
      const conflicts = checkTimeConflicts(task);
      
      if (conflicts.length > 0) {
        // Show conflict modal
        setConflictingTasks(conflicts);
        setPendingTask(task);
        setShowConflictModal(true);
        return;
      }
    }

    console.log("Creating task with data:", task);
    createTaskMutation.mutate(task);
  };

  // Handle conflict modal confirmation
  const handleConflictConfirm = () => {
    if (pendingTask) {
      console.log("Creating task despite conflicts:", pendingTask);
      createTaskMutation.mutate(pendingTask);
    }
  };

  // Handle conflict modal cancellation
  const handleConflictCancel = () => {
    setPendingTask(null);
    setConflictingTasks([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DialogHeader>
        <DialogTitle data-testid="modal-create-task-title">إنشاء مهمة جديدة</DialogTitle>
        <DialogDescription>املأ النموذج أدناه لإنشاء مهمة جديدة لفريقك.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-2 mt-3">
        <div>
          <Label htmlFor="title">العنوان *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="أدخل عنوان المهمة"
            data-testid="input-task-title"
          />
        </div>

        <div>
          <Label htmlFor="description">الوصف *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="أدخل وصف المهمة"
            rows={1}
            data-testid="textarea-task-description"
            className="text-sm min-h-[2rem] resize-none"
          />
        </div>

        <div className="w-full">
          <div className="flex items-center justify-between">
            <Label htmlFor="customerName">اسم العميل *</Label>
            <AddCustomerDialog
              onCustomerAdded={(customer) => {
                setCustomerName(customer.name);
                if (customer.phone) setCustomerPhone(customer.phone);
                if (customer.email) setCustomerEmail(customer.email);
                if (customer.address) setCustomerAddress(customer.address);
              }}
            />
          </div>
          <div className="space-y-2">
            <Select value={customerName} onValueChange={(value) => {
              setCustomerName(value);
              // Auto-fill customer details if customer exists
              const customer = customers?.find(c => c.name === value);
              if (customer) {
                if (customer.phone) setCustomerPhone(customer.phone);
                if (customer.email) setCustomerEmail(customer.email);
                if (customer.address) setCustomerAddress(customer.address);
              }
            }}>
              <SelectTrigger data-testid="select-task-customer-name" className="text-sm">
                <SelectValue placeholder="اختر أو أدخل العميل" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.name}>
                    {customer.name}
                    {customer.phone && ` (${customer.phone})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="أو أدخل اسم عميل مخصص"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              data-testid="input-task-customer-name-manual"
              className="text-sm"
            />
          </div>
        </div>

        <Collapsible open={isCustomerDetailsOpen} onOpenChange={setIsCustomerDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between p-2 h-8">
              تفاصيل العميل (اختياري)
              {isCustomerDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2 mt-2"
            >
              <div>
                <Label htmlFor="customer-phone" className="text-sm">هاتف العميل</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="مثال: +9647812345678"
                  data-testid="input-customer-phone-create"
                  className="text-sm"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  يرجى إدخال رقم الهاتف مع مفتاح الدولة (مثال: +964 للعراق)
                </div>
              </div>

              <div>
                <Label htmlFor="customer-email" className="text-sm">بريد العميل الإلكتروني</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="أدخل البريد الإلكتروني للعميل"
                  data-testid="input-customer-email-create"
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="customer-address" className="text-sm">عنوان العميل</Label>
                <Input
                  id="customer-address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="أدخل عنوان العميل"
                  data-testid="input-customer-address-create"
                  className="text-sm"
                />
              </div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        <div>
          <Label>الوقت/الجدول *</Label>
          <div className="grid grid-cols-2 gap-3">
            {/* Start Time */}
            <div>
              <Label htmlFor="start-time" className="text-xs text-muted-foreground">وقت البداية</Label>
              <div className="flex gap-1">
                <Input
                  id="start-time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="9:00"
                  className="text-sm"
                  data-testid="input-start-time"
                />
                <Select value={startPeriod} onValueChange={setStartPeriod}>
                  <SelectTrigger className="w-16 text-sm" data-testid="select-start-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Finish Time */}
            <div>
              <Label htmlFor="finish-time" className="text-xs text-muted-foreground">وقت الانتهاء</Label>
              <div className="flex gap-1">
                <Input
                  id="finish-time"
                  value={finishTime}
                  onChange={(e) => setFinishTime(e.target.value)}
                  placeholder="5:00"
                  className="text-sm"
                  data-testid="input-finish-time"
                />
                <Select value={finishPeriod} onValueChange={setFinishPeriod}>
                  <SelectTrigger className="w-16 text-sm" data-testid="select-finish-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority" className="text-sm">الأولوية</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger data-testid="select-task-priority-create" className="text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">منخفضة</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">تاريخ الإنجاز</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm h-9",
                    !dueDate && "text-muted-foreground"
                  )}
                  data-testid="button-task-due-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>اختر تاريخ الإنجاز</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  data-testid="calendar-task-due-date"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between p-2 h-8">
              خيارات متقدمة
              {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2 mt-2"
            >
              <div>
                <Label htmlFor="assignees" className="text-sm">المكلفون (تحديد متعدد)</Label>
                <div className="mt-2 space-y-1 max-h-20 overflow-y-auto border rounded-md p-2 bg-muted/30">
                  {teamMembers?.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`assignee-${member.id}`}
                        checked={assigneeIds.includes(member.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAssigneeIds([...assigneeIds, member.id]);
                          } else {
                            setAssigneeIds(assigneeIds.filter(id => id !== member.id));
                          }
                        }}
                        data-testid={`checkbox-assignee-${member.id}`}
                      />
                      <Label htmlFor={`assignee-${member.id}`} className="text-xs font-normal">
                        {member.name} - {member.role}
                      </Label>
                    </div>
                  ))}
                  {(!teamMembers || teamMembers.length === 0) && (
                    <p className="text-xs text-muted-foreground">لا يوجد أعضاء فريق متاحون</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  المحدد: {assigneeIds.length} عضو
                </p>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية (اختياري)"
                  rows={1}
                  data-testid="textarea-task-notes"
                  className="text-sm min-h-[2rem] resize-none"
                />
              </div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex space-x-3 pt-3 border-t mt-4">
          <Button
            type="submit"
            className="flex-1"
            disabled={createTaskMutation.isPending}
            data-testid="button-submit-task"
          >
            {createTaskMutation.isPending ? "جاري الإنشاء..." : "إنشاء المهمة"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            data-testid="button-cancel-create-task"
          >
            إلغاء
          </Button>
        </div>
      </form>

      {/* Time Conflict Modal */}
      <TimeConflictModal
        open={showConflictModal}
        onOpenChange={setShowConflictModal}
        conflictingTasks={conflictingTasks}
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
      />
    </motion.div>
  );
}
