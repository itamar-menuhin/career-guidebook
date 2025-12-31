import { useSession } from '@/contexts/SessionContext';
import { SessionSidebar } from '@/components/SessionSidebar';
import { SessionNotesDrawer } from '@/components/SessionNotesDrawer';
import { sessionSteps, getStepById } from '@/data/sessionSteps';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SessionPage() {
  const { session, isActive, setCurrentStep, startNewSession } = useSession();
  const currentStep = session ? getStepById(session.currentStep) : null;
  const stepIndex = sessionSteps.findIndex(s => s.id === session?.currentStep);

  if (!isActive) {
    return (
      <div className="flex min-h-[calc(100vh-56px)]">
        <SessionSidebar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="font-display text-3xl font-bold mb-4">Ready to Run a Session?</h1>
            <p className="text-muted-foreground mb-6">Start a new session to guide through the career counseling flow with structured steps and live note-taking.</p>
            <Button size="lg" className="gradient-hero text-primary-foreground" onClick={startNewSession}>
              <PlayCircle className="h-5 w-5 mr-2" />Start New Session
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <SessionSidebar className="hidden md:flex" />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {currentStep && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-2">Step {stepIndex + 1} of {sessionSteps.length}</p>
              <h1 className="font-display text-3xl font-bold mb-2">{currentStep.title}</h1>
              <p className="text-lg text-muted-foreground">{currentStep.description}</p>
            </div>

            <Card className="mb-8 shadow-soft">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Suggested Prompts</h3>
                <ul className="space-y-3">
                  {currentStep.prompts.map((prompt, i) => (
                    <li key={i} className="flex gap-3"><span className="text-primary font-medium">{i + 1}.</span><span>{prompt}</span></li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {currentStep.id === 'directions' && (
              <div className="mb-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm"><strong>Tip:</strong> Browse <Link to="/focus-areas" className="text-primary hover:underline">Focus Areas</Link> or <Link to="/cards" className="text-primary hover:underline">Cards</Link> and use "Add as direction" to populate notes.</p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" disabled={stepIndex === 0} onClick={() => setCurrentStep(sessionSteps[stepIndex - 1].id)}>
                <ChevronLeft className="h-4 w-4 mr-1" />Previous
              </Button>
              <Button disabled={stepIndex === sessionSteps.length - 1} onClick={() => setCurrentStep(sessionSteps[stepIndex + 1].id)}>
                Next<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </main>
      <SessionNotesDrawer />
    </div>
  );
}
