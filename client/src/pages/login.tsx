import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { CompanyLogo } from "@/components/ui/company-logo";
import { useLanguage } from "@/hooks/use-language";

interface LoginPageProps {
  onLoginSuccess: (user: { id: string; username: string }) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `أهلاً بك ${data.user.username}`,
        });
        onLoginSuccess(data.user);
      } else {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: data.message || "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء محاولة تسجيل الدخول",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "يمكنك الآن تسجيل الدخول",
        });
        setShowRegister(false);
        setUsername("");
        setPassword("");
      } else {
        toast({
          title: "خطأ في إنشاء الحساب",
          description: data.message || "حدث خطأ أثناء إنشاء الحساب",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء محاولة إنشاء الحساب",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <CompanyLogo size="lg" data-testid="company-logo" />
              </div>
              <h1 className="text-base font-semibold text-primary mb-3 leading-relaxed" data-testid="text-company-welcome">
                اهلا بكم في برنامج تتبع العمل في شركة اشراق الودق لتكنولوجيا المعلومات
              </h1>
            </div>
            <CardTitle className="text-2xl font-bold" data-testid="text-login-title">
              {showRegister ? "إنشاء حساب جديد" : "تسجيل الدخول"}
            </CardTitle>
            <CardDescription data-testid="text-login-description">
              {showRegister 
                ? "أدخل بيانات الحساب الجديد" 
                : "أدخل بيانات تسجيل الدخول الخاصة بك"
              }
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={showRegister ? handleRegister : handleLogin}>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  required
                  data-testid="input-username"
                />
              </div>
              <div>
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                  data-testid="input-password"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-3">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading 
                  ? (showRegister ? "جاري الإنشاء..." : "جاري تسجيل الدخول...") 
                  : (showRegister ? "إنشاء حساب" : "تسجيل الدخول")
                }
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => {
                  setShowRegister(!showRegister);
                  setUsername("");
                  setPassword("");
                }}
                data-testid="button-toggle-mode"
              >
                {showRegister ? "لديك حساب بالفعل؟ تسجيل الدخول" : "ليس لديك حساب؟ إنشاء حساب جديد"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}