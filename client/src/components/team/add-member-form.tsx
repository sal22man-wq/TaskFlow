import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertTeamMember } from "@shared/schema";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AddMemberFormProps {
  onSuccess: () => void;
}

export function AddMemberForm({ onSuccess }: AddMemberFormProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("available");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMemberMutation = useMutation({
    mutationFn: async (member: InsertTeamMember) => {
      const response = await apiRequest("POST", "/api/team-members", member);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Team member added successfully",
        description: "The new team member has been added.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error adding team member",
        description: "There was a problem adding the team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !role.trim() || !email.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const member: InsertTeamMember = {
      name: name.trim(),
      role: role.trim(),
      email: email.trim(),
      status,
      avatar: name.trim().split(' ').map(n => n[0]).join('').toUpperCase(),
    };

    createMemberMutation.mutate(member);
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle data-testid="modal-add-member-title">Add Team Member</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter member name"
            data-testid="input-member-name"
          />
        </div>

        <div>
          <Label htmlFor="role">Role *</Label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Enter member role"
            data-testid="input-member-role"
          />
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter member email"
            data-testid="input-member-email"
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger data-testid="select-member-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            type="submit"
            className="flex-1"
            disabled={createMemberMutation.isPending}
            data-testid="button-submit-member"
          >
            {createMemberMutation.isPending ? "Adding..." : "Add Member"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            data-testid="button-cancel-add-member"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
