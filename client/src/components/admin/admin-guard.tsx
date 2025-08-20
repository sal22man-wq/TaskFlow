import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const verifyPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      await apiRequest("POST", "/api/admin/verify-password", { password });
    },
    onSuccess: () => {
      setIsAuthenticated(true);
      toast({
        title: "تم منح الوصول",
        description: "أهلاً بك في لوحة الإدارة",
      });
    },
    onError: (error: any) => {
      toast({
        title: "تم رفض الوصول",
        description: "كلمة مرور المدير غير صحيحة",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كلمة المرور",
        variant: "destructive",
      });
      return;
    }
    verifyPasswordMutation.mutate(password);
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl" data-testid="text-admin-login-title">
            دخول المدير
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            أدخل كلمة مرور المدير للوصول إلى سجلات النظام
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="أدخل كلمة مرور المدير"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  data-testid="input-admin-password"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={verifyPasswordMutation.isPending || !password}
              data-testid="button-admin-login"
            >
              {verifyPasswordMutation.isPending ? "جارٍ التحقق..." : "دخول لوحة الإدارة"}
            </Button>
            
            <div className="text-xs text-center text-muted-foreground">
              استخدم نفس كلمة مرور حساب المدير
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}