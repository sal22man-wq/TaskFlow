import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QRCode from 'qrcode';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/lib/error-handler';
import { useLanguage } from '@/hooks/use-language';
import { ErrorBoundary, ComponentErrorFallback } from '@/components/error/error-boundary';
import { 
  MessageCircle, 
  Phone, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  QrCode,
  Send,
  Activity,
  Edit
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';

interface WhatsAppStatus {
  isConnected: boolean;
  isReady: boolean;
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

export default function WhatsAppManagement() {
  const { toast } = useToast();
  const { handleError, handleSuccess, t } = useErrorHandler();
  const queryClient = useQueryClient();
  const [editingMessage, setEditingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);

  // جلب حالة الواتساب
  const { data: status, isLoading: statusLoading } = useQuery<WhatsAppStatus>({
    queryKey: ['/api/whatsapp/status'],
    refetchInterval: 5000, // تحديث كل 5 ثوانِ
  });

  // جلب إعدادات الواتساب
  const { data: settings, isLoading: settingsLoading } = useQuery<WhatsAppSettings>({
    queryKey: ['/api/whatsapp/settings'],
  });

  // إعادة ربط الواتساب
  const reconnectMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/whatsapp/reconnect'),
    onSuccess: () => {
      handleSuccess('whatsapp.reconnecting', {
        title: t('whatsapp.reconnecting'),
        description: t('whatsapp.qrCode'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/status'] });
    },
    onError: (error) => {
      handleError(error, {
        title: t('error.generic'),
        action: () => reconnectMutation.mutate(),
        actionLabel: t('guidance.retry'),
      });
    },
  });

  // قطع اتصال الواتساب
  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/whatsapp/disconnect'),
    onSuccess: () => {
      handleSuccess('whatsapp.disconnected', {
        title: 'تم قطع الاتصال',
        description: 'تم قطع الاتصال مع الواتساب بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/status'] });
    },
    onError: (error) => {
      handleError(error, {
        title: t('error.generic'),
        action: () => disconnectMutation.mutate(),
        actionLabel: t('guidance.retry'),
      });
    },
  });

  // تحديث إعدادات الرسالة
  const updateMessageMutation = useMutation({
    mutationFn: (message: string) => 
      apiRequest('PUT', '/api/whatsapp/settings', { defaultMessage: message }),
    onSuccess: () => {
      handleSuccess('whatsapp.settingsUpdated');
      setEditingMessage(false);
      queryClient.invalidateQueries({ queryKey: ['/api/whatsapp/settings'] });
    },
    onError: (error) => {
      handleError(error, {
        title: t('error.validation'),
        action: () => updateMessageMutation.mutate(newMessage),
        actionLabel: t('guidance.retry'),
      });
    },
  });

  // إرسال رسالة تجريبية
  const testMessageMutation = useMutation({
    mutationFn: (phoneNumber: string) => 
      apiRequest('POST', '/api/whatsapp/test-message', { phoneNumber }),
    onSuccess: () => {
      handleSuccess('whatsapp.messageSent');
    },
    onError: (error) => {
      handleError(error, {
        title: t('whatsapp.messageFailed'),
        action: () => {
          const phoneInput = document.querySelector('input[placeholder*="966"]') as HTMLInputElement;
          if (phoneInput?.value) {
            testMessageMutation.mutate(phoneInput.value);
          }
        },
        actionLabel: t('guidance.retry'),
      });
    },
  });

  useEffect(() => {
    if (settings && !editingMessage) {
      setNewMessage(settings.defaultMessage || '');
    }
  }, [settings, editingMessage]);

  // توليد صورة QR Code عندما يكون متاحاً
  useEffect(() => {
    const generateQR = async () => {
      if (status?.qrCode) {
        try {
          const qrImage = await QRCode.toDataURL(status.qrCode, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrCodeImage(qrImage);
        } catch (error) {
          console.error('خطأ في توليد رمز QR:', error);
          setQrCodeImage(null);
        }
      } else {
        setQrCodeImage(null);
      }
    };

    generateQR();
  }, [status?.qrCode]);

  const handleUpdateMessage = () => {
    if (newMessage.trim()) {
      updateMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleTestMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const phoneNumber = formData.get('testPhone') as string;
    if (phoneNumber) {
      testMessageMutation.mutate(phoneNumber);
    }
  };

  if (statusLoading || settingsLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">إدارة الواتساب</h1>
        </div>
        <div className="text-center py-8">{t('guidance.loading')}</div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={ComponentErrorFallback}>
      <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">إدارة الواتساب</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/whatsapp-settings">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              إعدادات متقدمة
            </Button>
          </Link>
          <Link href="/admin/whatsapp-broadcast">
            <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <MessageCircle className="h-4 w-4" />
              رسائل جماعية
            </Button>
          </Link>
        </div>
      </div>

      {/* حالة الاتصال */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            حالة الاتصال
          </CardTitle>
          <CardDescription>
            مراقبة حالة ربط الواتساب الحالية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Label>حالة الربط:</Label>
              {status?.isConnected ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  متصل
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  غير متصل
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Label>الحالة:</Label>
              {status?.isReady ? (
                <Badge variant="default" className="bg-blue-500">جاهز</Badge>
              ) : (
                <Badge variant="secondary">غير جاهز</Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Label>عدد الرسائل:</Label>
              <Badge variant="outline">{status?.messagesCount || 0}</Badge>
            </div>
          </div>

          {status?.senderNumber && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <Label>رقم المرسل:</Label>
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {status.senderNumber}
              </code>
            </div>
          )}

          {status?.lastConnected && (
            <div className="text-sm text-gray-500">
              آخر اتصال: {new Date(status.lastConnected).toLocaleString('en-GB')}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => reconnectMutation.mutate()}
              disabled={reconnectMutation.isPending}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${reconnectMutation.isPending ? 'animate-spin' : ''}`} />
              إعادة ربط الواتساب
            </Button>
            
            {status?.isConnected && (
              <Button 
                variant="destructive"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="w-full sm:w-auto"
                data-testid="button-disconnect-whatsapp"
              >
                <XCircle className={`h-4 w-4 mr-2 ${disconnectMutation.isPending ? 'animate-spin' : ''}`} />
                قطع الاتصال
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      {status?.qrCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              رمز QR للربط
            </CardTitle>
            <CardDescription>
              امسح هذا الرمز بهاتفك لربط الواتساب
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              {qrCodeImage ? (
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <img 
                    src={qrCodeImage} 
                    alt="رمز QR للربط مع الواتساب"
                    className="w-64 h-64"
                    data-testid="img-qr-code"
                  />
                </div>
              ) : (
                <div className="bg-white p-4 rounded-lg text-center border">
                  <div className="animate-pulse">
                    <div className="w-64 h-64 bg-gray-200 rounded"></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">جاري تحميل رمز QR...</p>
                </div>
              )}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  📱 افتح واتساب على هاتفك
                </p>
                <p className="text-xs text-gray-500">
                  اذهب إلى إعدادات → الأجهزة المتصلة → ربط جهاز
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* إعدادات الرسائل */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات الرسائل
          </CardTitle>
          <CardDescription>
            تخصيص نص رسائل التقييم المرسلة للعملاء
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message-template">نص الرسالة الافتراضي:</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingMessage(!editingMessage)}
              >
                <Edit className="h-3 w-3 mr-1" />
                {editingMessage ? 'إلغاء' : 'تعديل'}
              </Button>
            </div>
            
            {editingMessage ? (
              <div className="space-y-2">
                <Textarea
                  id="message-template"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="اكتب نص الرسالة..."
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpdateMessage}
                    disabled={updateMessageMutation.isPending || !newMessage.trim()}
                  >
                    حفظ التغييرات
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setEditingMessage(false);
                      setNewMessage(settings?.defaultMessage || '');
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">
                  {settings?.defaultMessage || 'لم يتم تعيين رسالة افتراضية'}
                </pre>
              </div>
            )}
          </div>

          <Separator />

          {/* اختبار الرسائل */}
          <div className="space-y-2">
            <Label>إرسال رسالة تجريبية:</Label>
            <form onSubmit={handleTestMessage} className="flex gap-2">
              <Input
                name="testPhone"
                placeholder="رقم الهاتف (مثال: 966501234567)"
                className="flex-1"
                required
              />
              <Button 
                type="submit"
                disabled={testMessageMutation.isPending || !status?.isReady}
              >
                <Send className="h-4 w-4 mr-2" />
                إرسال
              </Button>
            </form>
            {!status?.isReady && (
              <Alert>
                <AlertDescription>
                  يجب ربط الواتساب أولاً قبل إرسال الرسائل التجريبية
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات مهمة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>• يتم إرسال رسائل التقييم تلقائياً عند تغيير حالة المهمة إلى "مكتملة"</p>
          <p>• تأكد من أن رقم الهاتف صحيح ويحتوي على رمز الدولة (966 للسعودية)</p>
          <p>• راقب وحدة التحكم لمتابعة حالة الرسائل المرسلة</p>
          <p>• في حالة انقطاع الاتصال، استخدم زر "إعادة ربط الواتساب"</p>
        </CardContent>
      </Card>
      </div>
    </ErrorBoundary>
  );
}