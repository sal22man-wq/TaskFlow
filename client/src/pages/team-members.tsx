import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit2, Trash2, Mail, User, UserPlus } from "lucide-react";
import { ProfileImageUploader } from "@/components/ProfileImageUploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  status: string;
  activeTasks: number;
  avatar?: string;
  profileImage?: string;
}

export default function TeamMembersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState({
    name: "",
    role: "user",
    email: "",
  });

  // Check if user has admin or supervisor permissions
  const canManageMembers = user?.role === "admin" || user?.role === "supervisor";

  const { data: teamMembers = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const createMemberMutation = useMutation({
    mutationFn: async (member: { name: string; role: string; email: string }) => {
      return await apiRequest("/api/team-members", {
        method: "POST",
        body: member,
      });
    },
    onSuccess: () => {
      toast({
        title: "تم إنشاء عضو الفريق",
        description: "تم إضافة عضو الفريق بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      setIsAddDialogOpen(false);
      setNewMember({ name: "", role: "user", email: "" });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة عضو الفريق",
        variant: "destructive",
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TeamMember> }) => {
      return await apiRequest(`/api/team-members/${id}`, {
        method: "PATCH",
        body: updates,
      });
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث عضو الفريق",
        description: "تم تحديث بيانات عضو الفريق بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      setEditingMember(null);
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث عضو الفريق",
        variant: "destructive",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/team-members/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "تم حذف عضو الفريق",
        description: "تم حذف عضو الفريق بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في حذف عضو الفريق",
        variant: "destructive",
      });
    },
  });

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    createMemberMutation.mutate(newMember);
  };

  const handleUpdateMember = () => {
    if (!editingMember) return;
    updateMemberMutation.mutate({
      id: editingMember.id,
      updates: editingMember,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "busy":
        return "bg-yellow-100 text-yellow-800";
      case "offline":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "متاح";
      case "busy":
        return "مشغول";
      case "offline":
        return "غير متصل";
      default:
        return status;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin":
        return "مدير النظام";
      case "supervisor":
        return "مشرف";
      case "user":
        return "مستخدم";
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل أعضاء الفريق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">أعضاء الفريق</h1>
        {canManageMembers && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 ml-2" />
                إضافة عضو جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة عضو فريق جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">الاسم</Label>
                  <Input
                    id="name"
                    placeholder="اسم العضو"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="البريد الإلكتروني"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="role">الدور</Label>
                  <Select value={newMember.role} onValueChange={(value) => setNewMember({ ...newMember, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">مستخدم</SelectItem>
                      <SelectItem value="supervisor">مشرف</SelectItem>
                      {user?.role === "admin" && <SelectItem value="admin">مدير النظام</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddMember} disabled={createMemberMutation.isPending}>
                    {createMemberMutation.isPending ? "جاري الإضافة..." : "إضافة"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {teamMembers.map((member) => (
          <Card key={member.id} className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-0 bg-white rounded-3xl overflow-hidden relative">
            {/* Decorative gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ padding: '2px' }}>
              <div className="bg-white rounded-3xl h-full w-full" />
            </div>
            
            <div className="relative z-10 bg-white rounded-3xl">
              <CardHeader className="pb-6 pt-8 text-center">
                <div className="flex justify-center mb-4">
                  <ProfileImageUploader
                    teamMemberId={member.id}
                    currentProfileImage={member.profileImage}
                    memberName={member.name}
                    size="lg"
                    showUploadIcon={canManageMembers}
                  />
                </div>
                <CardTitle className="text-2xl mb-3 text-gray-800 font-bold">{member.name}</CardTitle>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <Badge 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 font-semibold px-4 py-2 rounded-full text-sm shadow-md"
                  >
                    {getRoleText(member.role)}
                  </Badge>
                  <Badge className={`${getStatusColor(member.status)} px-4 py-2 font-semibold rounded-full text-sm shadow-md border-0`}>
                    {getStatusText(member.status)}
                  </Badge>
                </div>
                
                {canManageMembers && (
                  <div className="flex justify-center gap-3 mt-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-full bg-blue-50 hover:bg-blue-100 hover:scale-110 transition-all duration-200 text-blue-600"
                      onClick={() => setEditingMember(member)}
                    >
                      <Edit2 className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-full bg-red-50 hover:bg-red-100 hover:scale-110 transition-all duration-200 text-red-600"
                      onClick={() => deleteMemberMutation.mutate(member.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="pt-0 pb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="truncate text-gray-700 font-medium">{member.email}</span>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-2xl text-white">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">المهام النشطة</span>
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold">{member.activeTasks}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل عضو الفريق</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="edit-name">الاسم</Label>
                <Input
                  id="edit-name"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingMember.email}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">الدور</Label>
                <Select 
                  value={editingMember.role} 
                  onValueChange={(value) => setEditingMember({ ...editingMember, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">مستخدم</SelectItem>
                    <SelectItem value="supervisor">مشرف</SelectItem>
                    {user?.role === "admin" && <SelectItem value="admin">مدير النظام</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">الحالة</Label>
                <Select 
                  value={editingMember.status} 
                  onValueChange={(value) => setEditingMember({ ...editingMember, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">متاح</SelectItem>
                    <SelectItem value="busy">مشغول</SelectItem>
                    <SelectItem value="offline">غير متصل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateMember} disabled={updateMemberMutation.isPending}>
                  {updateMemberMutation.isPending ? "جاري التحديث..." : "تحديث"}
                </Button>
                <Button variant="outline" onClick={() => setEditingMember(null)}>
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}