import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserCheck, UserX, Users, Clock, UserPlus } from "lucide-react";
import { AddUserForm } from "@/components/admin/add-user-form";

interface User {
  id: string;
  username: string;
  role: string;
  isApproved: string;
  createdAt: string;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddUser, setShowAddUser] = useState(false);

  // Get all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "approved" | "rejected" }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/approve`, { isApproved: action });
    },
    onSuccess: (_, { action }) => {
      toast({
        title: action === "approved" ? "تم قبول المستخدم" : "تم رفض المستخدم",
        description: action === "approved" ? "المستخدم يمكنه الآن الدخول للنظام" : "تم رفض طلب المستخدم",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في معالجة الطلب",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (userId: string) => {
    approveMutation.mutate({ userId, action: "approved" });
  };

  const handleReject = (userId: string) => {
    approveMutation.mutate({ userId, action: "rejected" });
  };

  const getStatusBadge = (isApproved: string) => {
    switch (isApproved) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">موافق عليه</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">مرفوض</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">في الانتظار</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">غير محدد</Badge>;
    }
  };

  const getRoleText = (role: string) => {
    return role === "admin" ? "مدير" : "مستخدم عادي";
  };

  const pendingUsers = users.filter(user => user.isApproved === "pending");
  const approvedUsers = users.filter(user => user.isApproved === "approved");
  const rejectedUsers = users.filter(user => user.isApproved === "rejected");

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-medium">إدارة المستخدمين</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
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
        <h1 className="text-xl font-medium" data-testid="text-admin-users-title">
          إدارة المستخدمين
        </h1>
        <Button
          onClick={() => setShowAddUser(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
          data-testid="button-add-user"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          إضافة مستخدم
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</div>
            <div className="text-sm text-muted-foreground">في الانتظار</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <UserCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{approvedUsers.length}</div>
            <div className="text-sm text-muted-foreground">موافق عليهم</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <UserX className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold text-red-600">{rejectedUsers.length}</div>
            <div className="text-sm text-muted-foreground">مرفوضين</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Users - Priority Section */}
      {pendingUsers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4 text-yellow-700 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            المستخدمين في الانتظار ({pendingUsers.length})
          </h2>
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <Card key={user.id} className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium" data-testid={`text-user-${user.id}`}>
                        {user.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {getRoleText(user.role)} • تسجل في: {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                      <div className="mt-2">
                        {getStatusBadge(user.isApproved)}
                      </div>
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprove(user.id)}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-${user.id}`}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        قبول
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(user.id)}
                        disabled={approveMutation.isPending}
                        data-testid={`button-reject-${user.id}`}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        رفض
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Users List */}
      <div>
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          جميع المستخدمين ({users.length})
        </h2>
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className={user.isApproved === "pending" ? "bg-yellow-50" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium" data-testid={`text-all-user-${user.id}`}>
                      {user.username}
                      {user.role === "admin" && <span className="text-xs text-blue-600 mr-2">(مدير)</span>}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getRoleText(user.role)} • {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                    </p>
                    <div className="mt-2">
                      {getStatusBadge(user.isApproved)}
                    </div>
                  </div>
                  {user.isApproved === "pending" && (
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprove(user.id)}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-all-${user.id}`}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        قبول
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(user.id)}
                        disabled={approveMutation.isPending}
                        data-testid={`button-reject-all-${user.id}`}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        رفض
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">لا يوجد مستخدمين</h3>
            <p className="text-muted-foreground">لم يتم تسجيل أي مستخدمين بعد</p>
          </CardContent>
        </Card>
      )}

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="sm:max-w-md">
          <AddUserForm onSuccess={() => setShowAddUser(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}