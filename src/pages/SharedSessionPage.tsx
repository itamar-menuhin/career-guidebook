import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSharedSession, forkSession, saveSession, SharedSessionResult } from '@/lib/sessionStore';
import { useSession } from '@/contexts/SessionContext';
import { Session } from '@/data/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ExternalLink, GitFork, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SharedSessionPage() {
  const { slug } = useParams<{ slug: string }>();
  const { setSession } = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<SharedSessionResult | null>(null);

  useEffect(() => {
    async function loadSession() {
      if (!slug) {
        setResult({ success: false, error: 'not_found', message: 'No session slug provided' });
        setLoading(false);
        return;
      }
      
      const sessionResult = await getSharedSession(slug);
      setResult(sessionResult);
      setLoading(false);
    }
    
    loadSession();
  }, [slug]);

  const handleFork = () => {
    if (!result?.success) return;
    
    const forked = forkSession(result.session);
    saveSession(forked);
    setSession(forked);
    toast({ title: 'Session forked', description: 'You now have an editable copy.' });
    navigate('/session');
  };

  if (loading) {
    return (
      <div className="container max-w-2xl py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  if (!result?.success) {
    const errorResult = result as { success: false; error: string; message: string };
    const isExpired = errorResult.error === 'expired';
    
    return (
      <div className="container max-w-2xl py-12 text-center">
        <div className="mb-6">
          {isExpired ? (
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          ) : (
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          )}
        </div>
        <h1 className="font-display text-2xl font-bold mb-4">
          {isExpired ? 'Session Expired' : 'Session Not Found'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {errorResult.message || 'This session may have expired or the link is invalid.'}
        </p>
        {isExpired && (
          <p className="text-sm text-muted-foreground mb-6">
            Session links expire after 30 days. Ask the session owner to share a new link.
          </p>
        )}
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  const session = result.session;
  const { notes } = session;

  return (
    <div className="container max-w-2xl py-8">
      {/* Privacy Warning Banner */}
      <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          Anyone with this link can view this session. Avoid sharing sensitive personal details.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" asChild>
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Home</Link>
        </Button>
        <Button onClick={handleFork} className="gap-2">
          <GitFork className="h-4 w-4" />
          Fork & Edit
        </Button>
      </div>

      <div className="mb-6">
        <Badge variant="secondary">Shared Session (Read-Only)</Badge>
        <p className="text-sm text-muted-foreground mt-1">
          Created {new Date(session.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Snapshot */}
      <section className="mb-8">
        <h2 className="font-display text-xl font-semibold mb-4">Snapshot</h2>
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">Current Situation</p>
              <p className="text-muted-foreground">{notes.snapshot.currentSituation || '—'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Aiming For</p>
              <p className="text-muted-foreground">{notes.snapshot.aimingFor || '—'}</p>
            </div>
            {notes.snapshot.mustHaves.length > 0 && (
              <div>
                <p className="text-sm font-medium">Must-Haves</p>
                <ul>
                  {notes.snapshot.mustHaves.map((m, i) => (
                    <li key={i} className="text-muted-foreground">• {m}</li>
                  ))}
                </ul>
              </div>
            )}
            {notes.snapshot.constraints.length > 0 && (
              <div>
                <p className="text-sm font-medium">Constraints</p>
                <ul>
                  {notes.snapshot.constraints.map((c, i) => (
                    <li key={i} className="text-muted-foreground">• {c}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Directions */}
      {notes.promisingDirections.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display text-xl font-semibold mb-4">Promising Directions</h2>
          <div className="space-y-4">
            {notes.promisingDirections.map((dir, i) => (
              <Card key={dir.id} className="shadow-soft">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{i + 1}. {dir.title || 'Untitled'}</h3>
                  {dir.whyPromising && (
                    <p className="text-sm text-muted-foreground mb-2">{dir.whyPromising}</p>
                  )}
                  {dir.firstSmallSteps.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium">First Steps</p>
                      <ul>
                        {dir.firstSmallSteps.map((s, j) => (
                          <li key={j} className="text-sm text-muted-foreground">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {dir.links.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {dir.links.map((l, j) => (
                        <a
                          key={j}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {l.label}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Closing */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Closing</h2>
        <Card className="shadow-soft">
          <CardContent className="p-4 space-y-3">
            {notes.closing.nextSteps.length > 0 && (
              <div>
                <p className="text-sm font-medium">Next Steps</p>
                <ul>
                  {notes.closing.nextSteps.map((s, i) => (
                    <li key={i} className="text-muted-foreground">• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {notes.closing.followUpPlan && (
              <div>
                <p className="text-sm font-medium">Follow-up Plan</p>
                <p className="text-muted-foreground">{notes.closing.followUpPlan}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
