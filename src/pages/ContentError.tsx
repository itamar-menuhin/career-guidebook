import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ContentErrorProps {
  onRetry: () => void;
  message?: string;
}

export function ContentError({ onRetry, message }: ContentErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-lg w-full rounded-2xl border border-border/60 bg-card/70 p-8 shadow-soft text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-destructive">
          <AlertCircle className="h-6 w-6" />
          <p className="font-display text-lg font-semibold">Content failed to load</p>
        </div>
        <p className="text-muted-foreground">
          {message || 'We could not validate the guidebook content files. Please fix any schema errors and try again.'}
        </p>
        <div className="flex justify-center">
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry loading content
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Files are loaded from <code className="font-mono text-foreground/80">/public/content</code>.
        </p>
      </div>
    </div>
  );
}
