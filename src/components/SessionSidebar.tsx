import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { sessionSteps } from '@/data/sessionSteps';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Circle, ChevronRight, PlayCircle, StopCircle } from 'lucide-react';

interface SessionSidebarProps {
  className?: string;
}

const stepColorMap: Record<string, string> = {
  'step-opening': 'bg-step-opening',
  'step-background': 'bg-step-background',
  'step-happiness': 'bg-step-happiness',
  'step-constraints': 'bg-step-constraints',
  'step-directions': 'bg-step-directions',
  'step-wrap': 'bg-step-wrap',
};

const stepTextColorMap: Record<string, string> = {
  'step-opening': 'text-step-opening',
  'step-background': 'text-step-background',
  'step-happiness': 'text-step-happiness',
  'step-constraints': 'text-step-constraints',
  'step-directions': 'text-step-directions',
  'step-wrap': 'text-step-wrap',
};

export function SessionSidebar({ className }: SessionSidebarProps) {
  const { session, isActive, setCurrentStep, startNewSession, endSession } = useSession();

  const currentStepIndex = sessionSteps.findIndex(s => s.id === session?.currentStep);

  return (
    <aside className={cn('w-64 border-r bg-sidebar flex flex-col', className)}>
      <div className="p-4 border-b">
        <h2 className="font-display font-semibold text-lg">Session Flow</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isActive ? 'Guide through each step' : 'Start a new session'}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {sessionSteps.map((step, index) => {
            const isCompleted = currentStepIndex > index;
            const isCurrent = session?.currentStep === step.id;
            const isClickable = isActive;

            return (
              <button
                key={step.id}
                onClick={() => isClickable && setCurrentStep(step.id)}
                disabled={!isClickable}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all',
                  'hover:bg-sidebar-accent disabled:opacity-50 disabled:cursor-not-allowed',
                  isCurrent && 'bg-sidebar-accent',
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors',
                  isCompleted && stepColorMap[step.color],
                  isCompleted && 'text-white',
                  isCurrent && `border-2 ${stepTextColorMap[step.color]} border-current`,
                  !isCompleted && !isCurrent && 'border-2 border-muted-foreground/30'
                )}>
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Circle className="h-3 w-3 fill-current" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    isCurrent && stepTextColorMap[step.color],
                    !isCurrent && !isCompleted && 'text-muted-foreground'
                  )}>
                    {step.shortTitle}
                  </p>
                </div>

                {isCurrent && (
                  <ChevronRight className={cn('h-4 w-4 shrink-0', stepTextColorMap[step.color])} />
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-2">
        {isActive ? (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={endSession}
          >
            <StopCircle className="h-4 w-4 mr-2" />
            End Session
          </Button>
        ) : (
          <Button 
            className="w-full gradient-hero text-primary-foreground hover:opacity-90" 
            onClick={startNewSession}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Start New Session
          </Button>
        )}
      </div>
    </aside>
  );
}
