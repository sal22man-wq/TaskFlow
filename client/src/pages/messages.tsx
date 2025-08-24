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
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    staleTime: 3000, // Consider data stale after 3 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
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
      
      // Refresh conversation data after successful send
      if (selectedConversation) {
        setTimeout(() => {
          refetchConversation();
        }, 100); // Small delay to ensure server has processed the message
      }
      
      // Invalidate queries to refresh all data
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
      // Always update with fetched messages, even if empty
      setConversationMessages(fetchedConversationMessages);
    } else {
      // Clear messages only when no conversation is selected
      setConversationMessages([]);
    }
  }, [fetchedConversationMessages, selectedConversation]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    let messageData: { receiverId?: string; content: string; messageScope: string };
    
    if (selectedConversation) {
      // Sending in an existing conversation
      messageData = {
        receiverId: selectedConversation.type === "group" ? undefined : selectedConversation.participantId,
        content: newMessage.trim(),
        messageScope: selectedConversation.type,
      };
    } else {
      // Creating new conversation
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
    
    // Create optimistic message for immediate display
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
        // Check if message already exists to avoid duplicates
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
    <div className="flex flex-col h-screen md:h-[calc(100vh-2rem)] md:container md:mx-auto md:p-4 md:max-w-6xl" dir="rtl">
      {/* Header - Mobile and Desktop */}
      <div className="flex items-center gap-3 p-4 md:p-0 md:mb-4 border-b md:border-0 bg-background md:bg-transparent">
        {selectedConversation && (
          <Button
            variant="ghost"
            size="icon"
            onClick={backToConversations}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <MessageCircle className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">
          {selectedConversation ? selectedConversation.participantName : "الرسائل"}
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex md:grid md:grid-cols-12 md:gap-4 overflow-hidden">
        {/* Conversations List */}
        <div className={`${showConversations ? 'flex' : 'hidden'} md:flex md:col-span-4 flex-col w-full md:w-auto`}>
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-lg">المحادثات</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              <ScrollArea className="flex-1">
                {conversations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 px-4">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لا توجد محادثات بعد</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-4 hover:bg-muted/50 cursor-pointer border-b transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-primary/10 border-primary/20' : ''
                        }`}
                        onClick={() => openConversation(conversation)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            conversation.type === 'group' ? 'bg-blue-500' : 'bg-green-500'
                          }`}>
                            {conversation.type === 'group' ? <Users className="h-5 w-5" /> : conversation.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium truncate text-sm">
                                {conversation.participantName}
                              </h3>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(conversation.lastMessageTime)}
                                </span>
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs px-1 min-w-[20px] h-5">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.lastMessage}
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
        </div>

        {/* Chat Area */}
        <div className={`${!showConversations ? 'flex' : 'hidden'} md:flex md:col-span-8 flex-col w-full md:w-auto`}>
          {selectedConversation ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                      selectedConversation.type === 'group' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {selectedConversation.type === 'group' ? <Users className="h-4 w-4" /> : selectedConversation.avatar}
                    </div>
                    {selectedConversation.participantName}
                  </CardTitle>
                  <Badge variant={selectedConversation.type === 'group' ? 'default' : 'secondary'}>
                    {selectedConversation.type === 'group' ? 'جماعية' : 'خاصة'}
                  </Badge>
                </div>
              </CardHeader>
              
              {/* Messages Area */}
              <CardContent className="flex-1 p-0 flex flex-col min-h-0">
                <ScrollArea className="flex-1 p-4 min-h-0">
                  <div className="space-y-3">
                    {conversationMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>ابدأ محادثتك الآن</p>
                      </div>
                    ) : (
                      conversationMessages.map((message, index) => (
                        <div
                          key={message.id || `temp-${index}`}
                          className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderId === user?.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            {message.senderId !== user?.id && (
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-3 w-3" />
                                <span className="text-xs font-medium">
                                  {message.sender?.name || message.sender?.username || "مجهول"}
                                </span>
                              </div>
                            )}
                            <p className="text-sm">{message.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              message.senderId === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">
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
                
                {/* Message Input */}
                <div className="border-t p-4 flex-shrink-0">
                  <div className="flex gap-2 items-end">
                    <Textarea
                      placeholder="اكتب رسالتك هنا..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      rows={2}
                      className="flex-1 resize-none min-h-[2.5rem] max-h-24"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending || !newMessage.trim()}
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col h-full">
              {/* Send New Message */}
              <Card className="flex-1 flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    محادثة جديدة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col justify-center">
                  {/* Message Type Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      نوع الرسالة
                    </label>
                    <Select value={messageScope} onValueChange={(value) => {
                      setMessageScope(value);
                      if (value === "group") {
                        setSelectedReceiver("");
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الرسالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">رسالة خاصة</SelectItem>
                        <SelectItem value="group">رسالة جماعية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Receiver Selection - Only for private messages */}
                  {messageScope === "private" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
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
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                  {member.avatar || member.name.charAt(0)}
                                </div>
                                {member.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Group message info */}
                  {messageScope === "group" && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm text-primary">سيتم إرسال هذه الرسالة لجميع أعضاء الفريق</span>
                      </div>
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">
                      الرسالة
                    </label>
                    <Textarea
                      placeholder="اكتب رسالتك هنا..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={6}
                      className="min-h-32"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>

                  <Button
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending}
                    className="w-full mt-auto"
                  >
                    {sendMessageMutation.isPending ? "جاري الإرسال..." : "إرسال الرسالة"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}