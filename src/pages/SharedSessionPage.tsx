import { useParams, Link } from 'react-router-dom';
import { getSharedSession, forkSession, saveSession } from '@/lib/sessionStore';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, ExternalLink, GitFork } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SharedSessionPage() {
  const { slug } = useParams<{ slug: string }>();
  const { setSession } = useSession();
  const { toast } = useToast();
  const session = getSharedSession(slug || '');

  if (!session) {
    return (
      <div className="container max-w-2xl py-12 text-center">
        <h1 className="font-display text-2xl font-bold mb-4">Session Not Found</h1>
        <p className="text-muted-foreground mb-4">This session may have expired or the link is invalid.</p>
        <Button asChild><Link to="/">Go Home</Link></Button>
      </div>
    );
  }

  const handleFork = () => {
    const forked = forkSession(session);
    saveSession(forked);
    setSession(forked);
    toast({ title: 'Session forked', description: 'You now have an editable copy.' });
  };

  const { notes } = session;

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" asChild><Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Home</Link></Button>
        <Button onClick={handleFork}><GitFork className="h-4 w-4 mr-2" />Fork & Edit</Button>
      </div>

      <div className="mb-6">
        <Badge variant="secondary">Shared Session</Badge>
        <p className="text-sm text-muted-foreground mt-1">Created {new Date(session.createdAt).toLocaleDateString()}</p>
      </div>

      {/* Snapshot */}
      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold mb-4">Snapshot</h2>
        <Card className="shadow-soft"><CardContent className="p-4 space-y-3">
          <div><p className="text-sm font-medium">Current Situation</p><p className="text-muted-foreground">{notes.snapshot.currentSituation || '—'}</p></div>
          <div><p className="text-sm font-medium">Aiming For</p><p className="text-muted-foreground">{notes.snapshot.aimingFor || '—'}</p></div>
          {notes.snapshot.mustHaves.length > 0 && <div><p className="text-sm font-medium">Must-Haves</p><ul>{notes.snapshot.mustHaves.map((m, i) => <li key={i} className="text-muted-foreground">• {m}</li>)}</ul></div>}
          {notes.snapshot.constraints.length > 0 && <div><p className="text-sm font-medium">Constraints</p><ul>{notes.snapshot.constraints.map((c, i) => <li key={i} className="text-muted-foreground">• {c}</li>)}</ul></div>}
        </CardContent></Card>
      </section>

      {/* Directions */}
      {notes.promisingDirections.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display text-xl font-semibold mb-4">Promising Directions</h2>
          <div className="space-y-4">
            {notes.promisingDirections.map((dir, i) => (
              <Card key={dir.id} className="shadow-soft"><CardContent className="p-4">
                <h3 className="font-semibold mb-2">{i + 1}. {dir.title || 'Untitled'}</h3>
                {dir.whyPromising && <p className="text-sm text-muted-foreground mb-2">{dir.whyPromising}</p>}
                {dir.firstSmallSteps.length > 0 && <div className="mb-2"><p className="text-sm font-medium">First Steps</p><ul>{dir.firstSmallSteps.map((s, j) => <li key={j} className="text-sm text-muted-foreground">• {s}</li>)}</ul></div>}
                {dir.links.length > 0 && <div className="flex flex-wrap gap-2">{dir.links.map((l, j) => <a key={j} href={l.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />{l.label}</a>)}</div>}
              </CardContent></Card>
            ))}
          </div>
        </section>
      )}

      {/* Closing */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Closing</h2>
        <Card className="shadow-soft"><CardContent className="p-4 space-y-3">
          {notes.closing.nextSteps.length > 0 && <div><p className="text-sm font-medium">Next Steps</p><ul>{notes.closing.nextSteps.map((s, i) => <li key={i} className="text-muted-foreground">• {s}</li>)}</ul></div>}
          {notes.closing.followUpPlan && <div><p className="text-sm font-medium">Follow-up Plan</p><p className="text-muted-foreground">{notes.closing.followUpPlan}</p></div>}
        </CardContent></Card>
      </section>
    </div>
  );
}
