import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Calendar, Clock, Filter, Search, User, AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "warning" | "error" | "success";
  action: string;
  user: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

// Mock log data - in production this would come from your API
const mockLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    level: "info",
    action: "Task Created",
    user: "Sarah Chen",
    details: "Created task: Fix navigation bug",
    ipAddress: "192.168.1.100"
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    level: "success",
    action: "Task Completed",
    user: "John Smith",
    details: "Completed task: Update customer database",
    ipAddress: "192.168.1.101"
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    level: "warning",
    action: "Login Attempt",
    user: "Unknown",
    details: "Failed login attempt for admin account",
    ipAddress: "203.0.113.1"
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    level: "info",
    action: "Customer Added",
    user: "Sarah Chen",
    details: "Added new customer: ABC Corporation",
    ipAddress: "192.168.1.100"
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    level: "error",
    action: "System Error",
    user: "System",
    details: "Database connection timeout",
    ipAddress: "127.0.0.1"
  },
  {
    id: "6",
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    level: "info",
    action: "Team Member Added",
    user: "Admin",
    details: "Added team member: Mike Johnson",
    ipAddress: "192.168.1.102"
  },
  {
    id: "7",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    level: "success",
    action: "Backup Completed",
    user: "System",
    details: "Daily backup completed successfully",
    ipAddress: "127.0.0.1"
  }
];

export default function AdminLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  // In production, this would be a real API call
  const { data: logs, isLoading } = useQuery<LogEntry[]>({
    queryKey: ["/api/admin/logs"],
    queryFn: () => Promise.resolve(mockLogs), // Mock data
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error": return <XCircle className="w-4 h-4 text-red-600" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "success": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "info": return <Info className="w-4 h-4 text-blue-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error": return "destructive";
      case "warning": return "secondary";
      case "success": return "default";
      case "info": return "outline";
      default: return "outline";
    }
  };

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesAction = actionFilter === "all" || log.action.toLowerCase().includes(actionFilter.toLowerCase());
    
    return matchesSearch && matchesLevel && matchesAction;
  }) || [];

  const uniqueActions = [...new Set(logs?.map(log => log.action) || [])];

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold" data-testid="text-admin-logs-title">System Logs</h1>
        </div>
        <p className="text-muted-foreground text-sm">Administrator access to system activity and audit logs</p>
      </section>

      {/* Stats Cards */}
      <section className="px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-info-logs">
                    {logs?.filter(log => log.level === "info").length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Info</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-success-logs">
                    {logs?.filter(log => log.level === "success").length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Success</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-warning-logs">
                    {logs?.filter(log => log.level === "warning").length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <div>
                  <div className="text-2xl font-bold" data-testid="stat-error-logs">
                    {logs?.filter(log => log.level === "error").length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-logs"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="level-filter">Level</Label>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger data-testid="select-level-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="action-filter">Action</Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger data-testid="select-action-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map((action) => (
                      <SelectItem key={action} value={action.toLowerCase()}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Logs List */}
      <section className="px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Activity Log ({filteredLogs.length} entries)</span>
              <Button variant="outline" size="sm">
                Export Logs
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      data-testid={`log-entry-${log.id}`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getLevelIcon(log.level)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getLevelColor(log.level)} className="text-xs">
                            {log.level.toUpperCase()}
                          </Badge>
                          <span className="font-medium text-sm" data-testid={`log-action-${log.id}`}>
                            {log.action}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                            <Clock className="w-3 h-3" />
                            {log.timestamp.toLocaleString()}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-1" data-testid={`log-details-${log.id}`}>
                          {log.details}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span data-testid={`log-user-${log.id}`}>{log.user}</span>
                          </div>
                          {log.ipAddress && (
                            <span data-testid={`log-ip-${log.id}`}>IP: {log.ipAddress}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-logs">
                    No logs found matching your filters
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}