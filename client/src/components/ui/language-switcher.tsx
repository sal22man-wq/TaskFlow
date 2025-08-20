import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <Select value={language} onValueChange={(value: 'en' | 'ar') => setLanguage(value)}>
        <SelectTrigger className="w-32" data-testid="language-switcher">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en" data-testid="lang-en">
            {t('lang.english')}
          </SelectItem>
          <SelectItem value="ar" data-testid="lang-ar">
            {t('lang.arabic')}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function LanguageToggleButton() {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
      data-testid="language-toggle"
    >
      <Globe className="w-4 h-4" />
      {language === 'en' ? t('lang.arabic') : t('lang.english')}
    </Button>
  );
}