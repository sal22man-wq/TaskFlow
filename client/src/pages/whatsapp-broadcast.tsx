import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MessageSquare, Users, Send, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface BroadcastResult {
  totalUsers: number;
  successCount: number;
  failedCount: number;
  failedUsers: string[];
}

function WhatsAppBroadcastContent() {
  const [message, setMessage] = useState('');
  const [lastResult, setLastResult] = useState<BroadcastResult | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Get users count
  const { data: usersStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/users/count'],
  });

  // Send broadcast message
  const broadcastMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      return await apiRequest('POST', '/api/whatsapp/broadcast', { message: messageContent }) as BroadcastResult;
    },
    onSuccess: (result: BroadcastResult) => {
      setLastResult(result);
      setMessage('');
      toast({
        title: 'تم إرسال الرسائل بنجاح',
        description: `تم إرسال الرسالة إلى ${result.successCount} من أصل ${result.totalUsers} مستخدم`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في الإرسال',
        description: error.message || 'حدث خطأ أثناء إرسال الرسائل',
        variant: 'destructive',
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) {
      toast({
        title: 'رسالة فارغة',
        description: 'يرجى كتابة محتوى الرسالة قبل الإرسال',
        variant: 'destructive',
      });
      return;
    }

    broadcastMutation.mutate(message.trim());
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">إرسال رسائل واتساب جماعية</h1>
          <p className="text-sm text-muted-foreground">
            إرسال رسالة واحدة إلى جميع المستخدمين المسجلين في النظام
          </p>
        </div>
      </div>

      {/* Users Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            إحصائيات المستخدمين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1">
                <Users className="w-3 h-3 mr-1" />
                {(usersStats as any)?.totalUsers || 0} مستخدم مسجل
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <MessageSquare className="w-3 h-3 mr-1" />
                {(usersStats as any)?.activeUsers || 0} مستخدم نشط
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Composer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">كتابة الرسالة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="اكتب محتوى الرسالة التي تريد إرسالها لجميع المستخدمين..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="resize-none"
            data-testid="textarea-broadcast-message"
          />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {message.length} حرف
            </div>
            
            <Button
              onClick={handleSend}
              disabled={broadcastMutation.isPending || !message.trim()}
              className="min-w-24"
              data-testid="button-send-broadcast"
            >
              {broadcastMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  إرسال للجميع
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Result */}
      {lastResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="w-4 h-4 text-green-600" />
              نتيجة آخر إرسال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-lg font-semibold text-blue-900">
                  {lastResult.totalUsers}
                </div>
                <div className="text-sm text-blue-700">إجمالي المستخدمين</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-lg font-semibold text-green-900">
                  {lastResult.successCount}
                </div>
                <div className="text-sm text-green-700">تم الإرسال بنجاح</div>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-lg font-semibold text-red-900">
                  {lastResult.failedCount}
                </div>
                <div className="text-sm text-red-700">فشل في الإرسال</div>
              </div>
            </div>

            {lastResult.failedCount > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>المستخدمون الذين لم تصلهم الرسالة:</strong>
                  <div className="mt-1 text-sm">
                    {lastResult.failedUsers.join(', ')}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Alert>
        <MessageSquare className="h-4 w-4" />
        <AlertDescription>
          <strong>تعليمات مهمة:</strong>
          <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
            <li>ستصل الرسالة لجميع المستخدمين المسجلين الذين لديهم أرقام واتساب</li>
            <li>تأكد من محتوى الرسالة قبل الإرسال - لا يمكن التراجع عن الإرسال</li>
            <li>يمكن أن يستغرق إرسال الرسائل بضع دقائق حسب عدد المستخدمين</li>
            <li>سيتم عرض تقرير مفصل بنتائج الإرسال بعد الانتهاء</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default function WhatsAppBroadcast() {
  return <WhatsAppBroadcastContent />;
}