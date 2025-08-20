import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { ChatWindow } from "./chat-window";
import { useLanguage } from "@/hooks/use-language";

interface ChatButtonProps {
  taskId?: string;
  taskTitle?: string;
  variant?: "default" | "floating";
  className?: string;
}

export function ChatButton({ taskId, taskTitle, variant = "default", className = "" }: ChatButtonProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { t } = useLanguage();

  const buttonClass = variant === "floating" 
    ? "fixed bottom-32 right-4 w-14 h-14 rounded-full shadow-lg z-10 touch-manipulation"
    : "";

  return (
    <>
      <Button
        onClick={() => setIsChatOpen(true)}
        size={variant === "floating" ? "icon" : "sm"}
        variant={variant === "floating" ? "default" : "outline"}
        className={`${buttonClass} ${className}`}
        data-testid="button-open-chat"
      >
        <MessageCircle className="w-4 h-4" />
        {variant !== "floating" && <span className="ml-2">{t('chat.title')}</span>}
      </Button>

      <ChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        taskId={taskId}
        taskTitle={taskTitle}
      />
    </>
  );
}