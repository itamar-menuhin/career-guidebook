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
    <aside className={cn('w-72 border-r border-border/50 bg-sidebar/50 flex flex-col', className)}>
      <div className="p-5 border-b border-border/50">
        <h2 className="font-display font-medium text-lg">Session Flow</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isActive ? 'Guide through each step' : 'Start a new session'}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
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
                  'w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200',
                  'hover:bg-sidebar-accent/50 disabled:opacity-50 disabled:cursor-not-allowed',
                  isCurrent && 'bg-sidebar-accent shadow-xs',
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200',
                  isCompleted && stepColorMap[step.color],
                  isCompleted && 'text-white shadow-sm',
                  isCurrent && `border-2 ${stepTextColorMap[step.color]} border-current bg-background`,
                  !isCompleted && !isCurrent && 'border-2 border-muted-foreground/20 bg-background'
                )}>
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Circle className="h-3 w-3 fill-current" />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate transition-colors',
                    isCurrent && stepTextColorMap[step.color],
                    isCompleted && 'text-foreground',
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

      <div className="p-4 border-t border-border/50 space-y-2">
        {isActive ? (
          <Button 
            variant="outline" 
            className="w-full border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" 
            onClick={endSession}
          >
            <StopCircle className="h-4 w-4 mr-2" />
            End Session
          </Button>
        ) : (
          <Button 
            className="w-full btn-glow gradient-hero text-primary-foreground shadow-glow hover:shadow-elevated transition-all duration-300" 
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
