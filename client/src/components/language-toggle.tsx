import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

interface LanguageToggleProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function LanguageToggle({ className = '', variant = 'default' }: LanguageToggleProps) {
  const { language, toggleLanguage } = useLanguage();

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className={`rounded-full px-3 py-1 h-8 ${className}`}
      >
        {language === 'en' ? 'தமிழ்' : 'EN'}
      </Button>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        variant={language === 'en' ? "default" : "ghost"}
        size="sm"
        onClick={() => language !== 'en' && toggleLanguage()}
        className={`rounded-full px-4 font-semibold ${language === 'en' ? 'shadow-sm' : ''}`}
      >
        English
      </Button>
      <Button
        variant={language === 'ta' ? "default" : "ghost"}
        size="sm"
        onClick={() => language !== 'ta' && toggleLanguage()}
        className={`rounded-full px-4 font-semibold font-tamil ${language === 'ta' ? 'shadow-sm' : ''}`}
      >
        தமிழ்
      </Button>
    </div>
  );
}

// Export the component as default
const LanguageToggleComponent = LanguageToggle;
export default LanguageToggleComponent;