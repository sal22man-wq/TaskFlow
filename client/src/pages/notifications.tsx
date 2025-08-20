import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  relatedId: string | null;
  isRead: string;
  createdAt: string;
}

export default function Notifications() {
  const { toast } = useToast();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest(`/api/notifications/${notificationId}/read`, "PATCH");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "تم التحديث",
        description: "تم وضع علامة مقروء على الإشعار",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الإشعار",
        variant: "destructive",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case "task_completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "task_overdue":
        return <Clock className="h-5 w-5 text-red-600" />;
      case "new_message":
        return <Bell className="h-5 w-5 text-purple-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "task_assigned":
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/20";
      case "task_completed":
        return "bg-green-50 border-green-200 dark:bg-green-900/20";
      case "task_overdue":
        return "bg-red-50 border-red-200 dark:bg-red-900/20";
      case "new_message":
        return "bg-purple-50 border-purple-200 dark:bg-purple-900/20";
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-900/20";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "task_assigned":
        return "مهمة جديدة";
      case "task_completed":
        return "مهمة مكتملة";
      case "task_overdue":
        return "مهمة متأخرة";
      case "new_message":
        return "رسالة جديدة";
      default:
        return "إشعار";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const unreadNotifications = notifications.filter((n) => n.isRead === "false");
  const readNotifications = notifications.filter((n) => n.isRead === "true");

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          الإشعارات
        </h1>
        {unreadNotifications.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {unreadNotifications.length} جديد
          </Badge>
        )}
      </div>

      <div className="space-y-6">
        {/* Unread Notifications */}
        {unreadNotifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                الإشعارات الجديدة ({unreadNotifications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-96">
                <div className="space-y-3">
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`border rounded-lg p-4 ${getNotificationColor(notification.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {notification.title}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(notification.type)}
                              </Badge>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                              {notification.content}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(notification.createdAt), "dd/MM/yyyy HH:mm")}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          disabled={markAsReadMutation.isPending}
                          data-testid={`button-mark-read-${notification.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Read Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              الإشعارات المقروءة ({readNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              {readNotifications.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  لا توجد إشعارات مقروءة
                </div>
              ) : (
                <div className="space-y-3">
                  {readNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="border rounded-lg p-4 opacity-75 hover:opacity-100"
                    >
                      <div className="flex gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                              {notification.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {getTypeLabel(notification.type)}
                            </Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                            {notification.content}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(notification.createdAt), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {notifications.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                لا توجد إشعارات
              </h3>
              <p className="text-gray-500">
                ستظهر الإشعارات هنا عند إضافة مهام جديدة أو استلام رسائل
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}