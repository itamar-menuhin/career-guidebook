import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { buildFlowAnchor, parseFlowStepIdFromHash } from '@/lib/anchors';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronUp, 
  ChevronDown, 
  Target,
  User,
  Heart,
  Lock,
  Compass,
  CheckCircle,
  Link as LinkIcon,
  Check,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useContent } from '@/contexts/ContentContext';
import { MarkdownPage } from '@/components/MarkdownPage';

const stepIcons = {
  opening: Target,
  background: User,
  happiness: Heart,
  constraints: Lock,
  directions: Compass,
  wrap: CheckCircle,
};

export default function FlowPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { flowSteps, loading, refresh } = useContent();
  const steps = flowSteps;
  const stepsAvailable = steps.length > 0;
  const { toast } = useToast();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const getValidStepId = useCallback(
    (hashValue: string) => {
      if (!stepsAvailable) return null;
      const cleaned = parseFlowStepIdFromHash(hashValue);
      const fallback = steps[0]?.id ?? null;
      return steps.some(step => step.id === cleaned) ? cleaned : fallback;
    },
    [steps, stepsAvailable]
  );

  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const activeStepRef = useRef<string | null>(null);
  // Prevent scroll thrashing: track when we're programmatically scrolling
  // to prevent IntersectionObserver from triggering during navigation
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stepsAvailable) {
      setActiveStepId(null);
      activeStepRef.current = null;
      return;
    }
    const initialId = getValidStepId(location.hash) ?? steps[0].id;
    setActiveStepId(initialId);
    activeStepRef.current = initialId;
    const targetHash = `#${buildFlowAnchor(initialId)}`;
    if (location.hash !== targetHash) {
      navigate(`/flow${targetHash}`, { replace: true });
    }
  }, [getValidStepId, location.hash, navigate, steps, stepsAvailable]);

  // Scroll to section on hash change
  useEffect(() => {
    if (!stepsAvailable) return;
    const stepId = getValidStepId(location.hash);

    if (!stepId) return;

    if (stepId !== activeStepRef.current) {
      setActiveStepId(stepId);
      activeStepRef.current = stepId;
    }

    if (sectionRefs.current[stepId]) {
      // Mark that we're doing a programmatic scroll
      isProgrammaticScrollRef.current = true;
      
      // Clear any existing timeout
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      
      requestAnimationFrame(() => {
        sectionRefs.current[stepId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Allow scrollspy to resume after smooth scroll completes (~1s for smooth scroll)
        scrollTimeoutRef.current = window.setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 1000);
      });
    }
  }, [getValidStepId, location.hash, stepsAvailable]);

  const currentStepIndex = useMemo(
    () => steps.findIndex(s => s.id === activeStepId),
    [steps, activeStepId]
  );

  useEffect(() => {
    if (!stepsAvailable) return;
    const observer = new IntersectionObserver(
      entries => {
        // Don't update hash if we're in the middle of a programmatic scroll
        if (isProgrammaticScrollRef.current) {
          return;
        }

        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const nextActiveId = visible[0]?.target.getAttribute('id');

        if (nextActiveId) {
          const nextStepId = parseFlowStepIdFromHash(nextActiveId);
          if (nextStepId && nextStepId !== activeStepRef.current) {
            activeStepRef.current = nextStepId;
            setActiveStepId(nextStepId);
            // Use replaceState to avoid triggering scroll effect
            navigate(`/flow#${buildFlowAnchor(nextStepId)}`, { replace: true });
          }
        }
      },
      {
        rootMargin: '-40% 0px -45% 0px',
        threshold: [0.2, 0.35, 0.5],
      }
    );

    steps.forEach(step => {
      const node = sectionRefs.current[step.id];
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [navigate, steps, stepsAvailable]);

  const navigateToStep = (stepId: string) => {
    if (!stepsAvailable) return;
    
    // Mark as programmatic scroll
    isProgrammaticScrollRef.current = true;
    
    // Clear any existing timeout
    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    
    setActiveStepId(stepId);
    activeStepRef.current = stepId;
    navigate(`/flow#${buildFlowAnchor(stepId)}`);
    
    // Allow scrollspy to resume after navigation completes
    scrollTimeoutRef.current = window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 1000);
  };

  const goToPrevious = () => {
    if (!stepsAvailable || currentStepIndex <= 0) {
      return;
    }
    navigateToStep(steps[currentStepIndex - 1].id);
  };

  const goToNext = () => {
    if (!stepsAvailable || currentStepIndex === -1 || currentStepIndex >= steps.length - 1) {
      return;
    }
    navigateToStep(steps[currentStepIndex + 1].id);
  };

  const copyStepLink = (stepId: string) => {
    if (!stepId) return;
    const url = `${window.location.origin}/flow#${buildFlowAnchor(stepId)}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied',
      description: 'Step link copied to clipboard',
    });
  };

  if (loading && !stepsAvailable) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading flow content...</span>
        </div>
      </div>
    );
  }

  if (!loading && !stepsAvailable) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <p className="text-lg font-medium">Flow content failed to load.</p>
          <p className="text-muted-foreground">
            Check that <code>/public/content/data/flow.json</code> and referenced markdown files exist
            and match the expected schema.
          </p>
          <Button onClick={refresh} variant="outline">
            Retry loading
          </Button>
        </div>
      </div>
    );
  }

  const effectiveStepIndex = currentStepIndex === -1 ? 0 : currentStepIndex;
  const stepTotal = steps.length;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Left Sidebar - Step Navigation (Sticky) */}
      <aside className="hidden md:flex w-64 border-r border-border/50 bg-card/30 flex-col sticky top-16 h-[calc(100vh-64px)]">
        <div className="p-4 border-b border-border/50">
          <h2 className="font-display font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Flow steps
          </h2>
        </div>
        <nav className="flex-1 overflow-auto p-3 space-y-1">
          {steps.map((step, index) => {
            const isActive = step.id === activeStepId;
            const Icon = stepIcons[step.id as keyof typeof stepIcons] || Target;
            
            return (
              <button
                key={step.id}
                onClick={() => navigateToStep(step.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <span className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium shrink-0',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{step.shortTitle}</p>
                </div>
                <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-6 md:p-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-medium mb-2">Flow guide</h1>
            <p className="text-muted-foreground leading-relaxed">
              A structured flow for running effective 60-90 minute career counseling sessions.
              Use these prompts and guidance during your live calls.
            </p>
          </div>

          {/* Mobile Step Navigation */}
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={currentStepIndex === 0}
                onClick={goToPrevious}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                Step {effectiveStepIndex + 1} of {stepTotal}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={effectiveStepIndex === stepTotal - 1}
                onClick={goToNext}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* All Steps */}
          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = stepIcons[step.id as keyof typeof stepIcons] || Target;
              const isActive = step.id === activeStepId;
              
              return (
                <section
                  key={step.id}
                  id={buildFlowAnchor(step.id)}
                  ref={(el) => { sectionRefs.current[step.id] = el; }}
                  className={cn(
                    'scroll-mt-28 transition-all duration-300',
                    isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                  )}
                >
                  <div
                    className={cn(
                      'space-y-5 rounded-2xl border border-border/50 bg-card/70 p-5 md:p-6 shadow-soft transition-all duration-300',
                      isActive && 'ring-2 ring-primary/20 shadow-glow'
                    )}
                  >
                    {/* Step Header */}
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-xl shrink-0',
                        isActive ? 'gradient-hero text-primary-foreground shadow-glow' : 'bg-muted'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Step {index + 1}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => copyStepLink(step.id)}
                            title="Copy link to this step"
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            <span className="text-xs">Copy link</span>
                          </Button>
                        </div>
                        <div className="flex items-start gap-2">
                          <h2 className="font-display text-xl font-medium">{step.title}</h2>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                              <Check className="h-3 w-3" />
                              Live now
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Card className="shadow-soft border-border/50">
                      <CardContent className="p-5">
                        <MarkdownPage content={step.content} />
                      </CardContent>
                    </Card>

                    {/* Contextual tips for specific steps */}
                    {step.id === 'directions' && (
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/15">
                        <p className="text-sm leading-relaxed">
                          <strong className="text-primary">Tip:</strong> Browse{' '}
                          <Link to="/focus-areas" className="text-primary hover:underline underline-offset-2">Focus areas</Link>{' '}
                          or{' '}
                          <Link to="/cards" className="text-primary hover:underline underline-offset-2">Cards</Link>{' '}
                          to find relevant directions and resources to discuss.
                        </p>
                      </div>
                    )}

                    {step.id === 'wrap' && (
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/15">
                        <p className="text-sm leading-relaxed">
                          <strong className="text-primary">Tip:</strong> Check{' '}
                          <Link to="/templates" className="text-primary hover:underline underline-offset-2">Templates</Link>{' '}
                          for wrap summary formats and follow-up structures.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Bottom Navigation */}
          <div className="flex justify-between mt-12 pt-6 border-t border-border/50">
            <Button 
              variant="outline" 
              disabled={effectiveStepIndex === 0} 
              onClick={goToPrevious}
              className="border-border/60"
            >
              <ChevronUp className="h-4 w-4 mr-1.5" />
              Previous
            </Button>
            <Button 
              disabled={effectiveStepIndex === stepTotal - 1} 
              onClick={goToNext}
              className="gradient-hero text-primary-foreground hover:opacity-90"
            >
              Next
              <ChevronDown className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
