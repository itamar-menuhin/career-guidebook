import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  Loader2,
  BookOpen,
  FileText,
  Users,
  Lightbulb,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { MarkdownPage } from '@/components/MarkdownPage';

// Helper types for section parsing
interface Section {
  title: string;
  level: number;
  content: string[];
  children: Section[];
  id: string; // slug for anchor links
}

// Generate a slug from title
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Parse markdown into hierarchical sections
const parseSections = (md: string): Section[] => {
  if (!md) return [];
  const lines = md.split(/\r?\n/);
  const sections: Section[] = [];
  const stack: Section[] = [];

  lines.forEach(line => {
    const cleanLine = line.trimEnd();
    const match = cleanLine.match(/^\s*(#{2,6})\s+(.*)$/);
    if (match) {
      const level = match[1].length;
      const title = match[2].trim();
      const newSection: Section = {
        title,
        level,
        content: [],
        children: [],
        id: slugify(title),
      };

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length > 0) {
        stack[stack.length - 1].children.push(newSection);
      } else {
        sections.push(newSection);
      }
      stack.push(newSection);
    } else {
      if (stack.length > 0) {
        stack[stack.length - 1].content.push(line);
      }
    }
  });
  return sections;
};

// Flatten sections for sidebar navigation
const flattenSections = (sections: Section[], maxLevel = 5): Section[] => {
  const result: Section[] = [];
  const recurse = (items: Section[]) => {
    items.forEach(item => {
      if (item.level <= maxLevel) {
        result.push(item);
      }
      if (item.children.length > 0) {
        recurse(item.children);
      }
    });
  };
  recurse(sections);
  return result;
};

// Icons for H2 sections
const sectionIcons: Record<string, typeof BookOpen> = {
  'what-good-looks-like': Lightbulb,
  'core-stance': Users,
  'standard-operating-flow-60-90-minutes': Compass,
};

// Recursive section renderer with IDs for scroll-to
const RecursiveSection = ({
  section,
  openSections,
  toggleSection,
  isFirst,
}: {
  section: Section;
  openSections: Set<string>;
  toggleSection: (id: string) => void;
  isFirst?: boolean;
}) => {
  const hasContent = section.content.some(l => l.trim().length > 0);
  const hasChildren = section.children.length > 0;
  const isOpen = openSections.has(section.id);

  const titleSize = {
    2: 'text-2xl',
    3: 'text-xl',
    4: 'text-lg',
    5: 'text-base font-semibold',
    6: 'text-base font-medium',
  }[section.level] || 'text-base';

  const titleWeight = section.level === 2 ? 'font-medium' : 'font-semibold';
  const cardBg = section.level === 2
    ? 'bg-gradient-to-br from-primary/5 to-transparent border-border/50'
    : 'bg-transparent border-none shadow-none p-0';

  const Icon = section.level === 2
    ? (sectionIcons[section.id] || BookOpen)
    : null;

  return (
    <div id={section.id} className="scroll-mt-24">
      <Collapsible
        open={isOpen}
        onOpenChange={() => toggleSection(section.id)}
        className={cn('w-full transition-all', section.level > 2 && 'mt-2')}
      >
        <Card className={cn('shadow-sm', cardBg)}>
          <CollapsibleTrigger asChild>
            <div
              className={cn(
                'flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity select-none',
                section.level === 2 ? 'p-4 px-6' : 'py-2'
              )}
            >
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-hero text-primary-foreground shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                )}
                <h3 className={cn('font-display text-foreground', titleSize, titleWeight)}>
                  {section.title}
                </h3>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div
              className={cn(
                'text-foreground animate-in slide-in-from-top-2 fade-in duration-200',
                section.level === 2 ? 'px-6 pb-6 pt-2' : 'pl-8 pb-4'
              )}
            >
              {hasContent && (
                <MarkdownPage
                  content={section.content.join('\n\n')}
                  className={cn(
                    'max-w-none mb-4',
                    'prose-p:text-xl prose-p:leading-relaxed prose-p:mb-2',
                    'prose-li:text-xl prose-li:leading-relaxed prose-li:mb-1',
                    'prose-ul:my-0 prose-ul:mb-2'
                  )}
                />
              )}
              {hasChildren && (
                <div className={cn('space-y-2', section.level === 2 ? 'mt-4' : 'mt-2')}>
                  {section.children.map((child, idx) => (
                    <RecursiveSection
                      key={child.id}
                      section={child}
                      openSections={openSections}
                      toggleSection={toggleSection}
                    />
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Separator after H2 sections */}
      {section.level === 2 && !isFirst && (
        <div className="h-px bg-border/40 my-6" />
      )}
    </div>
  );
};

// Sidebar nav item renderer
const SidebarNavItem = ({
  section,
  activeSection,
  onClick,
}: {
  section: Section;
  activeSection: string | null;
  onClick: (id: string) => void;
}) => {
  const indent = {
    2: 'pl-0',
    3: 'pl-4',
    4: 'pl-8',
    5: 'pl-12',
    6: 'pl-16',
  }[section.level] || 'pl-0';

  const fontSize = {
    2: 'text-sm font-medium',
    3: 'text-sm',
    4: 'text-xs',
    5: 'text-xs text-muted-foreground',
    6: 'text-xs text-muted-foreground',
  }[section.level] || 'text-sm';

  const isActive = activeSection === section.id;

  return (
    <button
      onClick={() => onClick(section.id)}
      className={cn(
        'w-full text-left px-3 py-1.5 rounded-lg transition-all duration-200 truncate',
        indent,
        fontSize,
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      {section.title}
    </button>
  );
};

export default function FlowPage() {
  const { flowSteps, loading, refresh } = useContent();
  const overviewStep = useMemo(
    () => flowSteps.find(s => s.id === 'session-guide'),
    [flowSteps]
  );
  const overviewSections = useMemo(
    () => (overviewStep ? parseSections(overviewStep.content) : []),
    [overviewStep]
  );
  const flatSections = useMemo(
    () => flattenSections(overviewSections, 5),
    [overviewSections]
  );

  // Open first H2 section by default
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (overviewSections.length > 0) {
      initial.add(overviewSections[0].id);
    }
    return initial;
  });

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const location = useLocation();

  // Toggle section open/close
  const toggleSection = useCallback((id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Scroll to section and open it
  const scrollToSection = useCallback(
    (id: string) => {
      setActiveSection(id);
      setOpenSections(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      // Also open parent sections
      const findAndOpenParents = (sections: Section[], targetId: string, parents: string[] = []): boolean => {
        for (const section of sections) {
          if (section.id === targetId) {
            parents.forEach(p => setOpenSections(prev => new Set(prev).add(p)));
            return true;
          }
          if (findAndOpenParents(section.children, targetId, [...parents, section.id])) {
            return true;
          }
        }
        return false;
      };
      findAndOpenParents(overviewSections, id);

      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    },
    [overviewSections]
  );

  // Handle hash on load
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      scrollToSection(id);
    }
  }, [location.hash, scrollToSection]);

  if (loading && flowSteps.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading session guide...</span>
        </div>
      </div>
    );
  }

  if (!overviewStep) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <p className="text-lg font-medium">Session guide content failed to load.</p>
          <Button onClick={refresh} variant="outline">
            Retry loading
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Left Sidebar - Hierarchical Navigation */}
      <aside className="hidden lg:flex w-72 border-r border-border/50 bg-card/30 flex-col sticky top-16 h-[calc(100vh-64px)]">
        <div className="p-4 border-b border-border/50">
          <h2 className="font-display font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Session Guide
          </h2>
        </div>
        <nav className="flex-1 overflow-auto p-3 space-y-0.5">
          {flatSections.map(section => (
            <SidebarNavItem
              key={section.id}
              section={section}
              activeSection={activeSection}
              onClick={scrollToSection}
            />
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-6 md:p-10">
          {/* Header */}
          <div className="mb-10">
            <h1 className="font-display text-4xl font-medium mb-3">Session Guide</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A structured process for running effective 60–90 minute career counseling sessions.
              Use this guide during your live calls.
            </p>
          </div>

          {/* Quick Navigation (Mobile) */}
          <div className="lg:hidden mb-8">
            <div className="flex flex-wrap gap-2">
              {overviewSections.map(section => (
                <Button
                  key={section.id}
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection(section.id)}
                  className="text-xs"
                >
                  {section.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Session Overview Sections */}
          <div className="space-y-6">
            {overviewSections.map((section, idx) => (
              <RecursiveSection
                key={section.id}
                section={section}
                openSections={openSections}
                toggleSection={toggleSection}
                isFirst={idx === 0}
              />
            ))}
          </div>

          {/* Tips */}
          <div className="mt-12 p-6 bg-primary/5 rounded-2xl border border-primary/15">
            <p className="text-lg leading-relaxed">
              <strong className="text-primary">Tip:</strong> Browse{' '}
              <Link to="/focus-areas" className="text-primary hover:underline underline-offset-2">
                Focus areas
              </Link>{' '}
              or{' '}
              <Link to="/cards" className="text-primary hover:underline underline-offset-2">
                Cards
              </Link>{' '}
              to find relevant directions and resources. Check{' '}
              <Link to="/templates" className="text-primary hover:underline underline-offset-2">
                Templates
              </Link>{' '}
              for wrap summary formats.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
