import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/hooks/use-language";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error | null;
    resetError: () => void;
  }>;
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error boundary caught an error:", error, errorInfo);
    this.setState({
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error | null; 
  resetError: () => void; 
}) {
  const { t } = useLanguage();

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl" data-testid="text-error-title">
            {t('error.generic')}
          </CardTitle>
          <CardDescription>
            {t('guidance.contactSupport')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm font-mono">
                {error.message}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={resetError} 
              className="w-full"
              data-testid="button-retry"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('guidance.retry')}
            </Button>
            
            <Button 
              onClick={handleReload} 
              variant="outline" 
              className="w-full"
              data-testid="button-reload"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('guidance.refresh')}
            </Button>
            
            <Button 
              onClick={handleGoHome} 
              variant="ghost" 
              className="w-full"
              data-testid="button-home"
            >
              <Home className="h-4 w-4 mr-2" />
              العودة للرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Enhanced error fallback for specific components
export function ComponentErrorFallback({ 
  error, 
  resetError,
  componentName 
}: { 
  error: Error | null; 
  resetError: () => void;
  componentName?: string;
}) {
  const { t } = useLanguage();

  return (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium">
            {componentName ? `خطأ في ${componentName}` : t('error.generic')}
          </p>
          {error && (
            <p className="text-sm mt-1 opacity-80">
              {error.message}
            </p>
          )}
        </div>
        <Button 
          onClick={resetError} 
          size="sm" 
          variant="outline"
          data-testid="button-component-retry"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          {t('guidance.retry')}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// Export the error boundary component
export const ErrorBoundary = ErrorBoundaryClass;