import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Target,
  User,
  Heart,
  Lock,
  Compass,
  CheckCircle,
  Navigation,
} from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { buildFlowAnchor, parseFlowStepIdFromHash } from '@/lib/anchors';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const stepIcons = {
  opening: Target,
  background: User,
  happiness: Heart,
  constraints: Lock,
  directions: Compass,
  wrap: CheckCircle,
};

export function FlowJumpDropdown() {
  const navigate = useNavigate();
  const { flowSteps } = useContent();
  const location = useLocation();

  const handleJump = (stepId: string) => {
    navigate(`/flow#${buildFlowAnchor(stepId)}`);
  };

  const activeStepId =
    location.pathname.startsWith('/flow') && location.hash
      ? flowSteps.find(step => step.id === parseFlowStepIdFromHash(location.hash))?.id ?? null
      : null;

  if (flowSteps.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="h-9 px-3 gap-2 border-border/50"
      >
        <Navigation className="h-4 w-4" />
        <span className="hidden sm:inline">Jump to flow</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Jump to flow steps"
                className="relative h-9 w-9 border-border/50 hover:border-border hover:bg-muted/50 group"
              >
                <Navigation className="h-4 w-4" />
                <span className="sr-only">Jump to flow steps</span>
                <span className="pointer-events-none absolute left-full top-1/2 hidden -translate-y-1/2 translate-x-2 items-center gap-1 rounded-md bg-popover px-2 py-1 text-xs font-medium text-muted-foreground shadow-sm opacity-0 transition-opacity duration-150 lg:flex group-hover:opacity-100">
                  Jump to flow
                </span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            <div className="flex items-center gap-2 text-sm">Jump to flow steps</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end" className="min-w-64 w-72 bg-popover border-border shadow-lg">
        <DropdownMenuLabel className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider">
          <span>Flow steps</span>
          {activeStepId && <span className="text-[11px] font-semibold text-primary">Live</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {flowSteps.map((step, index) => {
          const Icon = stepIcons[step.id as keyof typeof stepIcons] || Target;
          const isActive = step.id === activeStepId;
          return (
            <DropdownMenuItem
              key={step.id}
              onClick={() => handleJump(step.id)}
              className={cn(
                'flex items-center gap-3 py-2.5 cursor-pointer rounded-md',
                isActive ? 'bg-primary/10 text-primary' : 'text-foreground'
              )}
              aria-current={isActive ? 'true' : undefined}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium',
                  isActive && 'bg-primary text-primary-foreground'
                )}
              >
                {index + 1}
              </span>
              <Icon className={cn('h-4 w-4 text-muted-foreground', isActive && 'text-primary')} />
              <span className="flex-1 text-sm leading-tight">{step.title}</span>
              {isActive && <CheckCircle className="h-4 w-4 text-primary" aria-hidden />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
