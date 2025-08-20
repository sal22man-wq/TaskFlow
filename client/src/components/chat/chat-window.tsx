import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, X, MessageCircle } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  taskId?: string;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string;
  taskTitle?: string;
}

export function ChatWindow({ isOpen, onClose, taskId, taskTitle }: ChatWindowProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Task has been created and assigned.",
      sender: "System",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "2", 
      content: "I'll start working on this right away.",
      sender: "Sarah Chen",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
      id: "3",
      content: "Perfect! Let me know if you need any help.",
      sender: "Mike Johnson",
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        sender: "You",
        timestamp: new Date(),
        taskId: taskId,
      };
      setMessages(prev => [...prev, message]);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getSenderColor = (sender: string) => {
    switch (sender) {
      case "System": return "bg-blue-100 text-blue-800";
      case "You": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md h-[80vh] md:h-[600px] flex flex-col">
        <CardHeader className="flex-shrink-0 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">
                {taskTitle ? `${t('chat.taskChat')}: ${taskTitle}` : t('chat.title')}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-chat"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 pt-0">
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === 'You' ? 'flex-row-reverse rtl:flex-row' : 'rtl:flex-row-reverse'}`}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className={`text-xs ${getSenderColor(message.sender)}`}>
                      {getInitials(message.sender)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${message.sender === 'You' ? 'text-right' : ''}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {message.sender}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div
                      className={`inline-block px-3 py-2 rounded-lg text-sm max-w-[80%] ${
                        message.sender === 'You'
                          ? 'bg-primary text-primary-foreground'
                          : message.sender === 'System'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="flex-shrink-0 pt-4">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chat.typeMessage')}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size="sm"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}