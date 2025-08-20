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
import { InsertTask, TeamMember, Customer } from "@shared/schema";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Calendar as CalendarIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateTaskFormProps {
  onSuccess: () => void;
}

export function CreateTaskForm({ onSuccess }: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date>();
  
  // Collapsible sections state
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Fetch customers from API
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: InsertTask) => {
      const response = await apiRequest("POST", "/api/tasks", task);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Task created successfully",
        description: "The new task has been added to your team.",
      });
      // Reset form
      setTitle("");
      setDescription("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setTime("");
      setNotes("");
      setPriority("medium");
      setAssigneeIds([]);
      setDueDate(undefined);
      onSuccess();
    },
    onError: (error: Error) => {
      console.error("Task creation error:", error);
      toast({
        title: "Error creating task",
        description: error.message || "There was a problem creating the task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !customerName.trim() || !time.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields: title, description, customer name, and time.",
        variant: "destructive",
      });
      return;
    }

    const task: InsertTask = {
      title: title.trim(),
      description: description.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      time: time.trim(),
      notes: notes.trim() || undefined,
      priority,
      assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
      dueDate: dueDate ? dueDate : undefined,
      status: "pending",
      progress: 0,
    };

    console.log("Creating task with data:", task);
    createTaskMutation.mutate(task);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DialogHeader>
        <DialogTitle data-testid="modal-create-task-title">Create New Task</DialogTitle>
        <DialogDescription>Fill in the form below to create a new task for your team.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-2 mt-3">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            data-testid="input-task-title"
          />
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            rows={1}
            data-testid="textarea-task-description"
            className="text-sm min-h-[2rem] resize-none"
          />
        </div>

        <div className="w-full">
          <div className="flex items-center justify-between">
            <Label htmlFor="customerName">Customer Name *</Label>
            <AddCustomerDialog
              onCustomerAdded={(customer) => {
                setCustomerName(customer.name);
                if (customer.phone) {
                  setCustomerPhone(customer.phone);
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Select value={customerName} onValueChange={(value) => {
              setCustomerName(value);
              // Auto-fill phone and address if customer exists
              const customer = customers?.find(c => c.name === value);
              if (customer) {
                if (customer.phone) setCustomerPhone(customer.phone);
                if (customer.address) setCustomerAddress(customer.address);
              }
            }}>
              <SelectTrigger data-testid="select-task-customer-name" className="text-sm">
                <SelectValue placeholder="Select or enter customer" />
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
              placeholder="Or enter custom customer name"
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
              Customer Details (Optional)
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
                <Label htmlFor="customer-phone" className="text-sm">Customer Phone</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter customer phone number"
                  data-testid="input-customer-phone-create"
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="customer-address" className="text-sm">Customer Address</Label>
                <Input
                  id="customer-address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Enter customer address"
                  data-testid="input-customer-address-create"
                  className="text-sm"
                />
              </div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>

        <div>
          <Label htmlFor="time">Time/Schedule *</Label>
          <Input
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="e.g., 2 hours, 9:00 AM - 12:00 PM"
            data-testid="input-task-time"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority" className="text-sm">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger data-testid="select-task-priority-create" className="text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">تاريخ الإنجاز</Label>
            <div className="space-y-2">
              {/* Quick Date Choices */}
              <div className="grid grid-cols-2 gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setDueDate(new Date())}
                  data-testid="button-date-today"
                >
                  اليوم
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setDueDate(addDays(new Date(), 1))}
                  data-testid="button-date-tomorrow"
                >
                  غداً
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setDueDate(addDays(new Date(), 3))}
                  data-testid="button-date-3-days"
                >
                  خلال 3 أيام
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setDueDate(addDays(new Date(), 7))}
                  data-testid="button-date-week"
                >
                  الأسبوع القادم
                </Button>
              </div>
              
              {/* Calendar Picker */}
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
                    {dueDate ? format(dueDate, "PPP") : <span>اختر تاريخ مخصص</span>}
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
        </div>

        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between p-2 h-8">
              Advanced Options
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
                <Label htmlFor="assignees" className="text-sm">Assignees (Multiple Selection)</Label>
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
                    <p className="text-xs text-muted-foreground">No team members available</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {assigneeIds.length} member(s)
                </p>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes (optional)"
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
            {createTaskMutation.isPending ? "Creating..." : "Create Task"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            data-testid="button-cancel-create-task"
          >
            Cancel
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
