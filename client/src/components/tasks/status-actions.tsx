import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, CheckCircle, Clock, RotateCcw } from "lucide-react";

interface StatusActionsProps {
  taskId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export function StatusActions({ taskId, currentStatus, onStatusChange }: StatusActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PUT", `/api/tasks/${taskId}`, { status });
      return response.json();
    },
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      onStatusChange?.(newStatus);
      toast({
        title: "Status updated",
        description: `Task status changed to ${getStatusLabel(newStatus)}`,
      });
    },
    onError: () => {
      toast({
        title: "Error updating status",
        description: "There was a problem updating the task status.",
        variant: "destructive",
      });
    },
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pending";
      case "start": return "Started";
      case "complete": return "Complete";
      default: return status;
    }
  };

  const getStatusColor = (status: string): "secondary" | "destructive" | "default" | "outline" => {
    switch (status) {
      case "pending": return "secondary";     // Gray for waiting
      case "start": return "destructive";     // Blue for in progress  
      case "complete": return "default";      // Green for completed
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "start": return <Play className="w-4 h-4" />;
      case "complete": return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(newStatus);
  };

  const getNextAction = () => {
    switch (currentStatus) {
      case "pending":
        return {
          status: "start",
          label: "Start Task",
          icon: <Play className="w-4 h-4" />,
          variant: "default" as const,
        };
      case "start":
        return {
          status: "complete",
          label: "Complete Task",
          icon: <CheckCircle className="w-4 h-4" />,
          variant: "default" as const,
        };
      case "complete":
        return {
          status: "pending",
          label: "Reset to Pending",
          icon: <RotateCcw className="w-4 h-4" />,
          variant: "outline" as const,
        };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <div className="flex items-center gap-2" data-testid={`status-actions-${taskId}`}>
      {/* Current Status Badge */}
      <Badge 
        variant={getStatusColor(currentStatus)} 
        className="flex items-center gap-1"
        data-testid={`status-badge-${taskId}`}
      >
        {getStatusIcon(currentStatus)}
        {getStatusLabel(currentStatus)}
      </Badge>

      {/* Action Button */}
      {nextAction && (
        <Button
          size="sm"
          variant={nextAction.variant}
          onClick={() => handleStatusChange(nextAction.status)}
          disabled={updateStatusMutation.isPending}
          className="flex items-center gap-1"
          data-testid={`status-action-${taskId}`}
        >
          {updateStatusMutation.isPending ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            nextAction.icon
          )}
          {updateStatusMutation.isPending ? "Updating..." : nextAction.label}
        </Button>
      )}
    </div>
  );
}