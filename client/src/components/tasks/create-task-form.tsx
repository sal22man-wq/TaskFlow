import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertTask, TeamMember } from "@shared/schema";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CreateTaskFormProps {
  onSuccess: () => void;
}

export function CreateTaskForm({ onSuccess }: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [staffName, setStaffName] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");

  // Common customers for quick selection
  const commonCustomers = [
    "ABC Company", "XYZ Corporation", "Tech Solutions Inc", "Global Services Ltd", "Innovation Partners"
  ];

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
      setStaffName("");
      setTime("");
      setNotes("");
      setPriority("medium");
      setAssigneeIds([]);
      setDueDate("");
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error creating task",
        description: "There was a problem creating the task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !customerName.trim() || !staffName.trim() || !time.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields: title, description, customer name, staff name, and time.",
        variant: "destructive",
      });
      return;
    }

    const task: InsertTask = {
      title: title.trim(),
      description: description.trim(),
      customerName: customerName.trim(),
      staffName: staffName.trim(),
      time: time.trim(),
      notes: notes.trim() || undefined,
      priority,
      assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: "to_be_completed",
      progress: 0,
    };

    createTaskMutation.mutate(task);
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle data-testid="modal-create-task-title">Create New Task</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
            rows={3}
            data-testid="textarea-task-description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerName">Customer Name *</Label>
            <div className="space-y-2">
              <Select value={customerName} onValueChange={setCustomerName}>
                <SelectTrigger data-testid="select-task-customer-name">
                  <SelectValue placeholder="Select or enter customer" />
                </SelectTrigger>
                <SelectContent>
                  {commonCustomers.map((customer) => (
                    <SelectItem key={customer} value={customer}>
                      {customer}
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

          <div>
            <Label htmlFor="staffName">Staff Name *</Label>
            <Select value={staffName} onValueChange={setStaffName}>
              <SelectTrigger data-testid="select-task-staff-name">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.name}>
                    {member.name} - {member.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes (optional)"
            rows={2}
            data-testid="textarea-task-notes"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger data-testid="select-task-priority-create">
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
            <Label htmlFor="assignees">Assignees (Multiple Selection)</Label>
            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
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
                  <Label htmlFor={`assignee-${member.id}`} className="text-sm font-normal">
                    {member.name} - {member.role}
                  </Label>
                </div>
              ))}
              {(!teamMembers || teamMembers.length === 0) && (
                <p className="text-sm text-muted-foreground">No team members available</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Selected: {assigneeIds.length} member(s)
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            data-testid="input-task-due-date-create"
          />
        </div>

        <div className="flex space-x-3 pt-4">
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
    </div>
  );
}
