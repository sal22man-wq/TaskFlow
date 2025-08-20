import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export function LanguageSwitcher() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <div className="w-32 text-sm text-muted-foreground">
        {t('lang.arabic')}
      </div>
    </div>
  );
}

export function LanguageToggleButton() {
  const { t } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2 opacity-50 cursor-not-allowed"
      data-testid="language-toggle"
      disabled
    >
      <Globe className="w-4 h-4" />
      {t('lang.arabic')}
    </Button>
  );
}