import { useNavigate } from 'react-router-dom';
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
import { buildFlowAnchor } from '@/lib/anchors';

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

  const handleJump = (stepId: string) => {
    navigate(`/flow#${buildFlowAnchor(stepId)}`);
  };

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
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 gap-2 border-border/50 hover:border-border hover:bg-muted/50"
        >
          <Navigation className="h-4 w-4" />
          <span className="hidden sm:inline">Jump to flow</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-popover border-border shadow-lg">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Flow steps
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {flowSteps.map((step, index) => {
          const Icon = stepIcons[step.id as keyof typeof stepIcons] || Target;
          return (
            <DropdownMenuItem
              key={step.id}
              onClick={() => handleJump(step.id)}
              className="flex items-center gap-3 py-2.5 cursor-pointer"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-medium">
                {index + 1}
              </span>
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{step.title}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
