import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, MessageSquare, RefreshCw, QrCode, Loader2, Settings, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface WhatsAppStatus {
  isConnected: boolean;
  isReady: boolean;
  status: string;
  message: string;
  senderNumber: string | null;
  lastConnected: string | null;
  qrCode: string | null;
  messagesCount: number;
}

interface WhatsAppSettings {
  defaultMessage: string;
  senderName: string;
  autoSend: boolean;
}

export default function WhatsAppSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testPhoneNumber, setTestPhoneNumber] = useState("");

  // Fetch WhatsApp status
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: 5000, // Auto refresh every 5 seconds
  });

  // Fetch WhatsApp settings
  const { data: settings, isLoading: settingsLoading } = useQuery<WhatsAppSettings>({
    queryKey: ["/api/whatsapp/settings"],
  });

  // Restart WhatsApp mutation
  const restartMutation = useMutation({
    mutationFn: async () => {
      return await fetch("/api/whatsapp/restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "تم إعادة التشغيل",
        description: "تم إعادة تشغيل خدمة الواتساب وتجديد رمز QR بنجاح",
      });
      refetchStatus();
    },
    onError: (error) => {
      console.error("Error restarting WhatsApp:", error);
      toast({
        title: "خطأ",
        description: "فشل في إعادة تشغيل خدمة الواتساب",
        variant: "destructive",
      });
    },
  });

  // Reconnect WhatsApp mutation
  const reconnectMutation = useMutation({
    mutationFn: async () => {
      return await fetch("/api/whatsapp/reconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "تم الطلب",
        description: "تم طلب إعادة الاتصال بالواتساب",
      });
      refetchStatus();
    },
    onError: (error) => {
      console.error("Error reconnecting WhatsApp:", error);
      toast({
        title: "خطأ",
        description: "فشل في إعادة الاتصال بالواتساب",
        variant: "destructive",
      });
    },
  });

  // Send test message mutation
  const testMessageMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      await apiRequest("/api/whatsapp/test-message", "POST", { phoneNumber });
    },
    onSuccess: () => {
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الرسالة التجريبية بنجاح",
      });
      setTestPhoneNumber("");
    },
    onError: (error) => {
      console.error("Error sending test message:", error);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الرسالة التجريبية",
        variant: "destructive",
      });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<WhatsAppSettings>) => {
      await apiRequest("/api/whatsapp/settings", "PUT", newSettings);
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث إعدادات الواتساب بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/settings"] });
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث إعدادات الواتساب",
        variant: "destructive",
      });
    },
  });

  // Enable real WhatsApp mutation
  const enableRealMutation = useMutation({
    mutationFn: async () => {
      return await fetch("/api/whatsapp/enable-real", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "تم التفعيل",
        description: "تم تفعيل الواتساب الحقيقي - امسح رمز QR الجديد",
      });
      refetchStatus();
    },
    onError: (error) => {
      console.error("Error enabling real WhatsApp:", error);
      toast({
        title: "خطأ",
        description: "فشل في تفعيل الواتساب الحقيقي",
        variant: "destructive",
      });
    },
  });

  // Disable real WhatsApp mutation
  const disableRealMutation = useMutation({
    mutationFn: async () => {
      return await fetch("/api/whatsapp/disable-real", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "تم الإلغاء",
        description: "تم العودة لوضع المحاكاة",
      });
      refetchStatus();
    },
    onError: (error) => {
      console.error("Error disabling real WhatsApp:", error);
      toast({
        title: "خطأ",
        description: "فشل في إلغاء تفعيل الواتساب الحقيقي",
        variant: "destructive",
      });
    },
  });

  if (authLoading || statusLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || ((user as any).role !== "admin" && (user as any).role !== "supervisor")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">غير مخول</h1>
          <p className="text-gray-600">تحتاج إلى صلاحيات مدير أو مشرف للوصول لهذه الصفحة</p>
        </div>
      </div>
    );
  }

  const handleSendTestMessage = () => {
    if (!testPhoneNumber.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الهاتف",
        variant: "destructive",
      });
      return;
    }
    testMessageMutation.mutate(testPhoneNumber);
  };

  const handleUpdateSettings = (defaultMessage: string) => {
    updateSettingsMutation.mutate({ defaultMessage });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إعدادات الواتساب</h1>
        <p className="text-gray-600">إدارة اتصال الواتساب ورسائل التقييم</p>
      </div>

      <div className="grid gap-6">
        {/* WhatsApp Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              حالة الاتصال
            </CardTitle>
            <CardDescription>
              معلومات حالة اتصال خدمة الواتساب
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">حالة الخدمة:</span>
              <Badge variant={status?.isConnected ? "default" : "secondary"}>
                {status?.isConnected ? "متصل" : "غير متصل"}
              </Badge>
            </div>
            
            {status?.senderNumber && (
              <div className="flex items-center justify-between">
                <span className="font-medium">رقم الواتساب:</span>
                <span className="text-sm text-gray-600">+{status.senderNumber}</span>
              </div>
            )}

            {status?.lastConnected && (
              <div className="flex items-center justify-between">
                <span className="font-medium">آخر اتصال:</span>
                <span className="text-sm text-gray-600">
                  {new Date(status.lastConnected).toLocaleString('ar-SA')}
                </span>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => restartMutation.mutate()}
                disabled={restartMutation.isPending}
                variant="outline"
                size="sm"
              >
                {restartMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                إعادة تشغيل وتجديد QR
              </Button>
              
              <Button 
                onClick={() => reconnectMutation.mutate()}
                disabled={reconnectMutation.isPending}
                variant="outline"
                size="sm"
              >
                {reconnectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                إعادة اتصال
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Display */}
        {status?.qrCode && !status?.isConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                رمز QR للاتصال
              </CardTitle>
              <CardDescription>
                امسح هذا الرمز بواتساب هاتفك للاتصال
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-2">افتح الواتساب على هاتفك واختر "الأجهزة المرتبطة" ثم امسح الرمز</p>
                <div className="bg-white p-4 rounded border inline-block">
                  <pre className="text-xs font-mono whitespace-pre">
████████████████████████████████
██ ▄▄▄▄▄ █▀█ █▄▀▄▀▄▄▄█ ▄▄▄▄▄ ██
██ █   █ █▀▀▀█ ▄▄  ▄▄█ █   █ ██
██ █▄▄▄█ █▀ █▀ ▀▀▀ ▄▀█ █▄▄▄█ ██
██▄▄▄▄▄▄▄█▄▀ ▀▄█▄█ █▄█▄▄▄▄▄▄▄██
██▄▄  ▄▀▄  ▄ ▄▀▄▄▄▄  ▀ ▀▄█▄▄▄██
████▄▄▄▄▄▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀██
████████████████████████████████
                  </pre>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  رمز QR يتم تجديده تلقائياً كل مرة يتم إعادة تشغيل الخدمة
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real WhatsApp Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              تفعيل الواتساب الحقيقي
            </CardTitle>
            <CardDescription>
              تبديل بين وضع المحاكاة والواتساب الحقيقي
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-3">
                <strong>ملاحظة:</strong> النظام حالياً في وضع المحاكاة. رمز QR المعروض تجريبي فقط.
              </p>
              <p className="text-sm text-yellow-700">
                لتفعيل الواتساب الحقيقي، اضغط على الزر أدناه وامسح رمز QR الجديد بواتساب هاتفك.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => enableRealMutation.mutate()}
                disabled={enableRealMutation.isPending}
                className="flex-1"
              >
                {enableRealMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <QrCode className="h-4 w-4 mr-2" />
                )}
                تفعيل الواتساب الحقيقي
              </Button>
              
              <Button 
                onClick={() => disableRealMutation.mutate()}
                disabled={disableRealMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                {disableRealMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                العودة للمحاكاة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              رسالة تجريبية
            </CardTitle>
            <CardDescription>
              إرسال رسالة تجريبية لاختبار الاتصال
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">رقم الهاتف (+964)</label>
              <input
                type="text"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="أدخل رقم الهاتف مع رمز الدولة"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button 
              onClick={handleSendTestMessage}
              disabled={testMessageMutation.isPending || !status?.isConnected}
              className="w-full"
            >
              {testMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              إرسال رسالة تجريبية
            </Button>
          </CardContent>
        </Card>

        {/* Message Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              إعدادات الرسائل
            </CardTitle>
            <CardDescription>
              تخصيص نص رسالة التقييم المرسلة للعملاء
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">نص الرسالة الافتراضية</label>
              <Textarea
                value={settings?.defaultMessage || ""}
                onChange={(e) => handleUpdateSettings(e.target.value)}
                placeholder="أدخل نص الرسالة الافتراضية..."
                rows={8}
                className="w-full"
              />
            </div>
            <p className="text-xs text-gray-500">
              يمكنك استخدام المتغيرات: {"{customerName}"} للاسم، {"{taskTitle}"} لعنوان المهمة
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}