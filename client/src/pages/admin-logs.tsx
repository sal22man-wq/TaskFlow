import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Calendar, User, Globe, Smartphone, Filter } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface SystemLog {
  id: string;
  action: string;
  userId: string | null;
  username: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}

export default function AdminLogs() {
  const { t } = useLanguage();
  const [actionFilter, setActionFilter] = useState<string>("all");

  // Get system logs
  const { data: logs = [], isLoading } = useQuery<SystemLog[]>({
    queryKey: ["/api/admin/logs"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "login_success":
        return "bg-green-100 text-green-800";
      case "login_failed":
        return "bg-red-100 text-red-800";
      case "logout":
        return "bg-gray-100 text-gray-800";
      case "task_created":
        return "bg-blue-100 text-blue-800";
      case "task_updated":
        return "bg-yellow-100 text-yellow-800";
      case "task_status_changed":
        return "bg-orange-100 text-orange-800";
      case "task_progress_updated":
        return "bg-indigo-100 text-indigo-800";
      case "task_deleted":
        return "bg-red-100 text-red-800";
      case "role_changed":
        return "bg-purple-100 text-purple-800";
      case "user_created":
        return "bg-cyan-100 text-cyan-800";
      case "user_approved":
        return "bg-green-100 text-green-800";
      case "user_rejected":
        return "bg-red-100 text-red-800";
      case "user_role_changed":
        return "bg-purple-100 text-purple-800";
      case "user_disabled":
        return "bg-gray-100 text-gray-800";
      case "user_deleted":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "login_success":
        return "تسجيل دخول ناجح";
      case "login_failed":
        return "فشل تسجيل الدخول";
      case "logout":
        return "تسجيل خروج";
      case "task_created":
        return "إنشاء مهمة";
      case "task_updated":
        return "تحديث مهمة";
      case "task_status_changed":
        return "تغيير حالة مهمة";
      case "task_progress_updated":
        return "تحديث تقدم مهمة";
      case "task_deleted":
        return "حذف مهمة";
      case "role_changed":
        return "تغيير صلاحيات";
      case "user_created":
        return "إنشاء مستخدم";
      case "user_approved":
        return "موافقة على مستخدم";
      case "user_rejected":
        return "رفض مستخدم";
      case "user_role_changed":
        return "تغيير دور مستخدم";
      case "user_disabled":
        return "تعطيل مستخدم";
      case "user_deleted":
        return "حذف مستخدم";
      default:
        return action;
    }
  };

  const parseDetails = (detailsStr: string | null) => {
    if (!detailsStr) return null;
    try {
      return JSON.parse(detailsStr);
    } catch {
      return detailsStr;
    }
  };

  const filteredLogs = logs.filter(log => {
    if (actionFilter === "all") return true;
    return log.action === actionFilter;
  });

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-medium">سجل أحداث النظام</h1>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-lg font-semibold text-primary mb-2">
          اهلا بكم في برنامج تتبع العمل في شركة اشراق الودق لتكنولوجيا المعلومات
        </h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-medium flex items-center" data-testid="text-admin-logs-title">
          <Activity className="h-5 w-5 mr-2" />
          سجل أحداث النظام
        </h1>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Filter className="h-4 w-4" />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="فلترة الأحداث" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأحداث</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>
                  {getActionText(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
            <div className="text-sm text-muted-foreground">إجمالي الأحداث</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <User className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">
              {logs.filter(log => log.action === "login_success").length}
            </div>
            <div className="text-sm text-muted-foreground">تسجيلات دخول ناجحة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold text-yellow-600">
              {logs.filter(log => log.action.includes("task")).length}
            </div>
            <div className="text-sm text-muted-foreground">أحداث المهام</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">
              {logs.filter(log => log.action === "role_changed").length}
            </div>
            <div className="text-sm text-muted-foreground">تغييرات الصلاحيات</div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">لا توجد أحداث</h3>
              <p className="text-muted-foreground">
                {actionFilter === "all" 
                  ? "لم يتم تسجيل أي أحداث بعد"
                  : `لا توجد أحداث من نوع "${getActionText(actionFilter)}"`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => {
            const details = parseDetails(log.details);
            return (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge className={getActionBadgeColor(log.action)}>
                        {getActionText(log.action)}
                      </Badge>
                      <span className="text-sm font-medium">
                        {log.username || "نظام"}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(log.timestamp).toLocaleString('ar-EG')}
                    </div>
                  </div>

                  {/* Details */}
                  {details && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm">
                      {typeof details === 'object' ? (
                        <div className="space-y-1">
                          {Object.entries(details).map(([key, value]) => (
                            <div key={key} className="flex items-center">
                              <span className="font-medium mr-2">{key}:</span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>{details}</span>
                      )}
                    </div>
                  )}

                  {/* Technical Info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {log.ipAddress && (
                      <div className="flex items-center">
                        <Globe className="h-3 w-3 mr-1" />
                        {log.ipAddress}
                      </div>
                    )}
                    {log.userAgent && (
                      <div className="flex items-center">
                        <Smartphone className="h-3 w-3 mr-1" />
                        <span className="truncate max-w-xs">
                          {log.userAgent.split(' ')[0]}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}