import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { sessionSteps } from '@/data/sessionSteps';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronUp, 
  ChevronDown, 
  Sparkles,
  Target,
  User,
  Heart,
  Lock,
  Compass,
  CheckCircle,
} from 'lucide-react';

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
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Get current step from hash
  const currentStepId = location.hash.replace('#', '') || sessionSteps[0].id;
  const currentStepIndex = sessionSteps.findIndex(s => s.id === currentStepId);

  // Scroll to section on hash change
  useEffect(() => {
    const stepId = location.hash.replace('#', '');
    if (stepId && sectionRefs.current[stepId]) {
      sectionRefs.current[stepId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const navigateToStep = (stepId: string) => {
    navigate(`/flow#${stepId}`);
  };

  const goToPrevious = () => {
    if (currentStepIndex > 0) {
      navigateToStep(sessionSteps[currentStepIndex - 1].id);
    }
  };

  const goToNext = () => {
    if (currentStepIndex < sessionSteps.length - 1) {
      navigateToStep(sessionSteps[currentStepIndex + 1].id);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Left Sidebar - Step Navigation */}
      <aside className="hidden md:flex w-64 border-r border-border/50 bg-card/30 flex-col">
        <div className="p-4 border-b border-border/50">
          <h2 className="font-display font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Session Flow
          </h2>
        </div>
        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-1">
            {sessionSteps.map((step, index) => {
              const isActive = step.id === currentStepId;
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
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-6 md:p-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-medium mb-2">Session Flow Guide</h1>
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
                Step {currentStepIndex + 1} of {sessionSteps.length}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={currentStepIndex === sessionSteps.length - 1}
                onClick={goToNext}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* All Steps */}
          <div className="space-y-12">
            {sessionSteps.map((step, index) => {
              const Icon = stepIcons[step.id as keyof typeof stepIcons] || Target;
              const isActive = step.id === currentStepId;
              
              return (
                <section
                  key={step.id}
                  id={step.id}
                  ref={(el) => { sectionRefs.current[step.id] = el; }}
                  className={cn(
                    'scroll-mt-24 transition-opacity duration-300',
                    isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                  )}
                >
                  {/* Step Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-xl shrink-0',
                      isActive ? 'gradient-hero text-primary-foreground shadow-glow' : 'bg-muted'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Step {index + 1}
                      </p>
                      <h2 className="font-display text-xl font-medium">{step.title}</h2>
                      <p className="text-muted-foreground mt-1">{step.description}</p>
                    </div>
                  </div>

                  {/* Prompts Card */}
                  <Card className="shadow-soft border-border/50">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h3 className="font-medium text-sm">Suggested Prompts</h3>
                      </div>
                      <ul className="space-y-3">
                        {step.prompts.map((prompt, i) => (
                          <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                            <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                            <span>{prompt}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Contextual tips for specific steps */}
                  {step.id === 'directions' && (
                    <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/15">
                      <p className="text-sm leading-relaxed">
                        <strong className="text-primary">Tip:</strong> Browse{' '}
                        <Link to="/focus-areas" className="text-primary hover:underline underline-offset-2">Focus Areas</Link>{' '}
                        or{' '}
                        <Link to="/cards" className="text-primary hover:underline underline-offset-2">Cards</Link>{' '}
                        to find relevant directions and resources to discuss.
                      </p>
                    </div>
                  )}

                  {step.id === 'wrap' && (
                    <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/15">
                      <p className="text-sm leading-relaxed">
                        <strong className="text-primary">Tip:</strong> Check{' '}
                        <Link to="/templates" className="text-primary hover:underline underline-offset-2">Templates</Link>{' '}
                        for session wrap summary formats and follow-up structures.
                      </p>
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {/* Bottom Navigation */}
          <div className="flex justify-between mt-12 pt-6 border-t border-border/50">
            <Button 
              variant="outline" 
              disabled={currentStepIndex === 0} 
              onClick={goToPrevious}
              className="border-border/60"
            >
              <ChevronUp className="h-4 w-4 mr-1.5" />
              Previous
            </Button>
            <Button 
              disabled={currentStepIndex === sessionSteps.length - 1} 
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
