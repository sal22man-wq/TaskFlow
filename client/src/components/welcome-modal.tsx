import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome message before
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md mx-4" data-testid="modal-welcome">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold mb-4" data-testid="text-welcome-title">
            أهلاً بك في تطبيق تتبع العمل
          </DialogTitle>
          <DialogDescription className="text-lg leading-relaxed" data-testid="text-welcome-message">
            اهلا بك في تطبيق تتبع العمل في شركة اشراق الودق
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mt-6">
          <Button 
            onClick={handleClose} 
            className="px-8 py-2"
            data-testid="button-welcome-close"
          >
            <Check className="w-4 h-4 mr-2" />
            ابدأ الآن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}