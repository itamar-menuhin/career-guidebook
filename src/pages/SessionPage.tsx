import { useSession } from '@/contexts/SessionContext';
import { SessionSidebar } from '@/components/SessionSidebar';
import { SessionNotesDrawer } from '@/components/SessionNotesDrawer';
import { sessionSteps, getStepById } from '@/data/sessionSteps';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, PlayCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SessionPage() {
  const { session, isActive, setCurrentStep, startNewSession } = useSession();
  const currentStep = session ? getStepById(session.currentStep) : null;
  const stepIndex = sessionSteps.findIndex(s => s.id === session?.currentStep);

  if (!isActive) {
    return (
      <div className="flex min-h-[calc(100vh-64px)]">
        <SessionSidebar />
        <main className="flex-1 flex items-center justify-center p-8 relative">
          <div className="absolute inset-0 gradient-glow opacity-30" />
          <div className="text-center max-w-md relative animate-fade-up">
            <div className="w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-6 shadow-glow">
              <PlayCircle className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-medium mb-4">Ready to Run a Session?</h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Start a new session to guide through the career counseling flow with structured steps and live note-taking.
            </p>
            <Button 
              size="lg" 
              className="btn-glow gradient-hero text-primary-foreground shadow-glow hover:shadow-elevated transition-all duration-300 h-12 px-6" 
              onClick={startNewSession}
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              Start New Session
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <SessionSidebar className="hidden md:flex" />
      <main className="flex-1 p-6 md:p-10 overflow-auto relative">
        <div className="absolute inset-0 gradient-glow opacity-20 pointer-events-none" />
        
        {currentStep && (
          <div className="max-w-2xl mx-auto relative animate-fade-up">
            {/* Step indicator */}
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                  Step {stepIndex + 1} of {sessionSteps.length}
                </span>
              </p>
              <h1 className="font-display text-3xl font-medium mb-3">{currentStep.title}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">{currentStep.description}</p>
            </div>

            {/* Prompts card */}
            <Card className="mb-8 shadow-soft border-border/50 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Suggested Prompts</h3>
                </div>
                <ul className="space-y-3">
                  {currentStep.prompts.map((prompt, i) => (
                    <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                      <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Tips for directions step */}
            {currentStep.id === 'directions' && (
              <div className="mb-8 p-5 bg-primary/5 rounded-xl border border-primary/15">
                <p className="text-sm leading-relaxed">
                  <strong className="text-primary">Tip:</strong> Browse{' '}
                  <Link to="/focus-areas" className="text-primary hover:underline underline-offset-2">Focus Areas</Link> or{' '}
                  <Link to="/cards" className="text-primary hover:underline underline-offset-2">Cards</Link>{' '}
                  and use "Add as direction" to populate your session notes.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                disabled={stepIndex === 0} 
                onClick={() => setCurrentStep(sessionSteps[stepIndex - 1].id)}
                className="border-border/60"
              >
                <ChevronLeft className="h-4 w-4 mr-1.5" />
                Previous
              </Button>
              <Button 
                disabled={stepIndex === sessionSteps.length - 1} 
                onClick={() => setCurrentStep(sessionSteps[stepIndex + 1].id)}
                className="gradient-hero text-primary-foreground hover:opacity-90"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}
      </main>
      <SessionNotesDrawer />
    </div>
  );
}
