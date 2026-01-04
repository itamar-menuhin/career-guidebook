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
  Navigation,
  BookOpen,
  Users,
  Lightbulb,
  Compass,
} from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

// Slugify for anchor links
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Parse H2 sections from markdown
const parseH2Sections = (md: string) => {
  if (!md) return [];
  const lines = md.split(/\r?\n/);
  const sections: { title: string; id: string }[] = [];

  lines.forEach(line => {
    const match = line.match(/^##\s+(.*)$/);
    if (match) {
      const title = match[1].trim();
      sections.push({ title, id: slugify(title) });
    }
  });
  return sections;
};

// Icons for sections
const sectionIcons: Record<string, typeof BookOpen> = {
  'what-good-looks-like': Lightbulb,
  'core-stance': Users,
  'standard-operating-flow-60-90-minutes': Compass,
};

export function FlowJumpDropdown() {
  const navigate = useNavigate();
  const { flowSteps } = useContent();

  const overviewStep = useMemo(
    () => flowSteps.find(s => s.id === 'flow-overview'),
    [flowSteps]
  );

  const sections = useMemo(
    () => (overviewStep ? parseH2Sections(overviewStep.content) : []),
    [overviewStep]
  );

  const handleJump = (sectionId: string) => {
    navigate(`/flow#${sectionId}`);
  };

  if (!overviewStep || sections.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="h-9 px-3 gap-2 border-border/50"
      >
        <Navigation className="h-4 w-4" />
        <span className="hidden sm:inline">Session Guide</span>
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
                aria-label="Jump to session guide sections"
                className="relative h-9 w-9 border-border/50 hover:border-border hover:bg-muted/50 group"
              >
                <Navigation className="h-4 w-4" />
                <span className="sr-only">Jump to session guide sections</span>
                <span className="pointer-events-none absolute left-full top-1/2 hidden -translate-y-1/2 translate-x-2 items-center gap-1 rounded-md bg-popover px-2 py-1 text-xs font-medium text-muted-foreground shadow-sm opacity-0 transition-opacity duration-150 lg:flex group-hover:opacity-100">
                  Session Guide
                </span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            <div className="flex items-center gap-2 text-sm">Jump to session guide</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end" className="min-w-64 w-72 bg-popover border-border shadow-lg">
        <DropdownMenuLabel className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wider">
          <span>Session Guide</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sections.map(section => {
          const Icon = sectionIcons[section.id] || BookOpen;
          return (
            <DropdownMenuItem
              key={section.id}
              onClick={() => handleJump(section.id)}
              className="flex items-center gap-3 py-2.5 cursor-pointer rounded-md text-foreground"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm leading-tight">{section.title}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
