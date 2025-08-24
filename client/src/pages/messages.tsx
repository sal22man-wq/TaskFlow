import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Users, ArrowLeft, Clock, User } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  id: string;
  senderId: string;
  receiverId: string | null;
  content: string;
  messageType: string;
  messageScope: string;
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

interface Conversation {
  id: string;
  participantId?: string;
  participantName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  type: 'private' | 'group';
  avatar?: string;
}

export default function Messages() {
  const [selectedReceiver, setSelectedReceiver] = useState<string>("");
  const [messageScope, setMessageScope] = useState<string>("private");
  const [newMessage, setNewMessage] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [showConversations, setShowConversations] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  // Fetch team members for message recipients
  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  // Get conversation messages
  const { data: fetchedConversationMessages = [], refetch: refetchConversation } = useQuery<Message[]>({
    queryKey: ["/api/messages/conversation", selectedConversation?.participantId, selectedConversation?.type],
    enabled: !!selectedConversation,
    refetchInterval: 5000,
    staleTime: 3000,
    gcTime: 5 * 60 * 1000,
  });

  // Extract conversations from messages
  const conversations: Conversation[] = messages.reduce((acc: Conversation[], message) => {
    const isGroupMessage = message.messageScope === "group";
    const participantId = isGroupMessage ? "group" : (message.senderId === user?.id ? message.receiverId : message.senderId);
    const participantName = isGroupMessage ? "المحادثة الجماعية" : (message.sender?.name || message.sender?.username || "مجهول");
    
    if (!participantId && !isGroupMessage) return acc;
    
    const conversationId = isGroupMessage ? "group" : participantId!;
    const existingConv = acc.find(conv => conv.id === conversationId);
    
    if (!existingConv) {
      acc.push({
        id: conversationId,
        participantId: isGroupMessage ? undefined : participantId!,
        participantName,
        lastMessage: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
        lastMessageTime: message.createdAt,
        unreadCount: message.isRead === "false" ? 1 : 0,
        type: isGroupMessage ? 'group' : 'private',
        avatar: message.sender?.username?.charAt(0) || 'M'
      });
    } else if (new Date(message.createdAt) > new Date(existingConv.lastMessageTime)) {
      existingConv.lastMessage = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
      existingConv.lastMessageTime = message.createdAt;
      if (message.isRead === "false") existingConv.unreadCount++;
    }
    
    return acc;
  }, []);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId?: string; content: string; messageScope: string }) => {
      return await apiRequest("POST", "/api/messages", messageData);
    },
    onSuccess: (data) => {
      setNewMessage("");
      
      if (selectedConversation) {
        setTimeout(() => {
          refetchConversation();
        }, 100);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      if (selectedConversation) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/messages/conversation", selectedConversation.participantId, selectedConversation.type] 
        });
      }
      
      toast({
        title: "تم الإرسال",
        description: selectedConversation ? "تم إرسال الرسالة بنجاح" : (messageScope === "group" ? "تم إرسال الرسالة الجماعية بنجاح" : "تم إرسال الرسالة بنجاح"),
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [fetchedConversationMessages]);

  // Update conversation messages when data changes
  useEffect(() => {
    if (selectedConversation) {
      setConversationMessages(fetchedConversationMessages);
    } else {
      setConversationMessages([]);
    }
  }, [fetchedConversationMessages, selectedConversation]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    let messageData: { receiverId?: string; content: string; messageScope: string };
    
    if (selectedConversation) {
      messageData = {
        receiverId: selectedConversation.type === "group" ? undefined : selectedConversation.participantId,
        content: newMessage.trim(),
        messageScope: selectedConversation.type,
      };
    } else {
      if (messageScope === "private" && !selectedReceiver) {
        toast({
          title: "خطأ",
          description: "يرجى اختيار المستلم للرسالة الخاصة",
          variant: "destructive",
        });
        return;
      }
      
      messageData = {
        receiverId: messageScope === "private" ? selectedReceiver : undefined,
        content: newMessage.trim(),
        messageScope,
      };
    }
    
    if (selectedConversation) {
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        senderId: user?.id || '',
        receiverId: messageData.receiverId || null,
        content: messageData.content,
        messageType: 'text',
        messageScope: messageData.messageScope,
        taskId: null,
        isRead: 'true',
        createdAt: new Date().toISOString(),
        sender: {
          id: user?.id || '',
          name: user?.username,
          username: user?.username
        }
      };
      
      setConversationMessages(prev => {
        const exists = prev.some(msg => msg.content === messageData.content && 
          (msg.id.startsWith('temp-') || msg.senderId === user?.id) && 
          Math.abs(new Date(msg.createdAt).getTime() - Date.now()) < 5000
        );
        
        if (exists) return prev;
        
        return [...prev, optimisticMessage];
      });
    }
    
    sendMessageMutation.mutate(messageData);
  };

  const openConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowConversations(false);
    refetchConversation();
  };

  const backToConversations = () => {
    setSelectedConversation(null);
    setShowConversations(true);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, "HH:mm");
    } else if (diffInHours < 24 * 7) {
      return format(date, "EEEE HH:mm");
    } else {
      return format(date, "dd/MM/yyyy HH:mm");
    }
  };

  if (messagesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex" dir="rtl">
      {/* Main Container - Messenger Style */}
      <div className="w-full max-w-7xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden flex h-full max-h-screen">
        
        {/* Conversations Sidebar */}
        <div className={`${showConversations ? 'flex' : 'hidden lg:flex'} w-full lg:w-80 flex-col border-r border-gray-200 bg-white`}>
          {/* Sidebar Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold">المحادثات</h1>
                <p className="text-xs text-white/80">{user?.username || 'المستخدم'}</p>
              </div>
              {selectedConversation && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={backToConversations}
                  className="lg:hidden text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Conversations List */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            <ScrollArea className="h-full">
              {conversations.length === 0 ? (
                <div className="text-center text-gray-500 py-16 px-4">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">لا توجد محادثات</h3>
                  <p className="text-sm">ابدأ محادثة جديدة الآن</p>
                </div>
              ) : (
                <div className="p-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-3 rounded-xl cursor-pointer transition-all duration-200 mb-1 ${
                        selectedConversation?.id === conversation.id 
                          ? 'bg-gradient-to-r from-blue-100 to-indigo-100 shadow-md border-r-4 border-blue-500' 
                          : 'hover:bg-white hover:shadow-sm'
                      }`}
                      onClick={() => openConversation(conversation)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar with online indicator */}
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                            conversation.type === 'group' 
                              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
                              : 'bg-gradient-to-br from-blue-400 to-blue-600'
                          }`}>
                            {conversation.type === 'group' ? (
                              <Users className="h-6 w-6" />
                            ) : (
                              conversation.participantName.charAt(0).toUpperCase()
                            )}
                          </div>
                          {/* Online indicator */}
                          {conversation.type === 'private' && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-gray-800 text-sm truncate">
                              {conversation.participantName}
                            </h3>
                            <span className="text-xs text-gray-500 font-medium">
                              {formatMessageTime(conversation.lastMessageTime)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-600 line-clamp-1 flex-1">
                              {conversation.lastMessage}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <div className="ml-2 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-xs font-bold">
                                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Chat Area - Messenger Style */}
        <div className={`${!showConversations ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-gradient-to-b from-gray-50 to-white`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={backToConversations}
                    className="lg:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${
                      selectedConversation.type === 'group' 
                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
                        : 'bg-gradient-to-br from-blue-400 to-blue-600'
                    }`}>
                      {selectedConversation.type === 'group' ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        selectedConversation.participantName.charAt(0).toUpperCase()
                      )}
                    </div>
                    {selectedConversation.type === 'private' && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-gray-800">{selectedConversation.participantName}</h2>
                    <p className="text-xs text-gray-500">
                      {selectedConversation.type === 'group' ? 'محادثة جماعية' : 'متصل الآن'}
                    </p>
                  </div>
                  <Badge 
                    variant={selectedConversation.type === 'group' ? 'default' : 'secondary'}
                    className="px-3 py-1"
                  >
                    {selectedConversation.type === 'group' ? 'جماعية' : 'خاصة'}
                  </Badge>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-hidden bg-gradient-to-b from-gray-50/50 to-white">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {conversationMessages.length === 0 ? (
                      <div className="text-center text-gray-500 py-16">
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">ابدأ محادثتك</h3>
                        <p className="text-sm">اكتب رسالتك الأولى لبدء المحادثة</p>
                      </div>
                    ) : (
                      conversationMessages.map((message, index) => (
                        <div
                          key={message.id || `temp-${index}`}
                          className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                            message.senderId === user?.id 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                              : 'bg-white border border-gray-200 text-gray-800'
                          }`}>
                            {message.senderId !== user?.id && selectedConversation.type === 'group' && (
                              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-blue-600">
                                <User className="h-3 w-3" />
                                <span>{message.sender?.name || message.sender?.username || "مجهول"}</span>
                              </div>
                            )}
                            <p className="text-sm leading-relaxed mb-1">{message.content}</p>
                            <div className={`flex items-center justify-end gap-1 text-xs ${
                              message.senderId === user?.id ? 'text-white/70' : 'text-gray-500'
                            }`}>
                              <Clock className="h-3 w-3" />
                              <span>
                                {message.createdAt ? format(new Date(message.createdAt), "HH:mm") : "الآن"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="اكتب رسالتك هنا..."
                      className="min-h-[44px] max-h-32 resize-none border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* New Message Interface */
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
              <div className="text-center max-w-md px-6">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="h-12 w-12 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">مرحباً بك في المحادثات</h2>
                <p className="text-gray-600 mb-8">اختر محادثة من القائمة الجانبية أو ابدأ محادثة جديدة</p>
                
                <Card className="p-6 bg-white shadow-lg border-0">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-lg text-right">رسالة جديدة</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">نوع الرسالة</label>
                      <Select value={messageScope} onValueChange={setMessageScope}>
                        <SelectTrigger className="w-full rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">رسالة خاصة</SelectItem>
                          <SelectItem value="group">رسالة جماعية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {messageScope === "private" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">المستلم</label>
                        <Select value={selectedReceiver} onValueChange={setSelectedReceiver}>
                          <SelectTrigger className="w-full rounded-xl">
                            <SelectValue placeholder="اختر عضو الفريق" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name || member.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">الرسالة</label>
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={messageScope === "group" ? "اكتب رسالتك للجميع..." : "اكتب رسالتك..."}
                        className="min-h-[100px] rounded-xl"
                      />
                    </div>
                    
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || (messageScope === "private" && !selectedReceiver) || sendMessageMutation.isPending}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl py-3"
                    >
                      {sendMessageMutation.isPending ? "جاري الإرسال..." : (
                        <>
                          <Send className="h-4 w-4 ml-2" />
                          إرسال الرسالة
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}