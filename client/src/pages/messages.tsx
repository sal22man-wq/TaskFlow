import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Message {
  id: string;
  senderId: string;
  receiverId: string | null;
  content: string;
  messageType: string;
  taskId: string | null;
  isRead: string;
  createdAt: string;
  sender?: {
    id: string;
    name?: string;
    username?: string;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function Messages() {
  const [selectedReceiver, setSelectedReceiver] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  // Fetch team members for message recipients
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: string; content: string }) => {
      return await apiRequest("/api/messages", "POST", messageData);
    },
    onSuccess: () => {
      setNewMessage("");
      setSelectedReceiver("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الرسالة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إرسال الرسالة",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!selectedReceiver || !newMessage.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المستلم وكتابة الرسالة",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      receiverId: selectedReceiver,
      content: newMessage.trim(),
    });
  };

  if (messagesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          الرسائل
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send New Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              إرسال رسالة جديدة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                المستلم
              </label>
              <Select value={selectedReceiver} onValueChange={setSelectedReceiver}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر عضو الفريق" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                          {member.avatar || member.name.charAt(0)}
                        </div>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                الرسالة
              </label>
              <Textarea
                placeholder="اكتب رسالتك هنا..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              className="w-full"
            >
              {sendMessageMutation.isPending ? "جاري الإرسال..." : "إرسال الرسالة"}
            </Button>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              الرسائل الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  لا توجد رسائل بعد
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                            {message.sender?.name?.charAt(0) || message.sender?.username?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {message.sender?.name || message.sender?.username || "مستخدم غير معروف"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(message.createdAt), "dd/MM/yyyy HH:mm")}
                            </p>
                          </div>
                        </div>
                        {message.isRead === "false" && (
                          <Badge variant="secondary">جديد</Badge>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}