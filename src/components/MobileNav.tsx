import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  PlayCircle,
  Map,
  Target,
  LayoutGrid,
  FileText,
  Menu,
  Lightbulb,
  Users,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState, useMemo } from 'react';
import { useContent } from '@/contexts/ContentContext';

const navItems = [
  { path: '/', label: 'Start Here', icon: BookOpen },
  { path: '/flow', label: 'Session', icon: PlayCircle },
  { path: '/pathways', label: 'Pathways', icon: Map },
  { path: '/focus-areas', label: 'Focus Areas', icon: Target },
  { path: '/cards', label: 'Cards', icon: LayoutGrid },
  { path: '/templates', label: 'Templates & Tools', icon: FileText },
];

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

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { flowSteps } = useContent();

  const overviewStep = useMemo(
    () => flowSteps.find(s => s.id === 'session-guide'),
    [flowSteps]
  );

  const sections = useMemo(
    () => (overviewStep ? parseH2Sections(overviewStep.content) : []),
    [overviewStep]
  );

  const handleSectionClick = (sectionId: string) => {
    navigate(`/flow#${sectionId}`);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-background">
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg">
              Career Guidebook
            </span>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                location.pathname === item.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Session Guide Quick Jump */}
        {sections.length > 0 && (
          <div className="px-4 pt-2 pb-4 border-t mt-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
              Session Guide Sections
            </p>
            <div className="space-y-1">
              {sections.map(section => {
                const Icon = sectionIcons[section.id] || BookOpen;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{section.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
