import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Lock, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function TemplatesPage() {
  const { toast } = useToast();

  const handleCopy = (text: string, name: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard', description: name });
  };

  const wrapTemplate = `## Snapshot
- **Current situation:** [...]
- **Aiming for:** [...]
- **Must-haves:** [...]
- **Constraints:** [...]

## Promising Directions
### 1. [Direction Title]
- **Why promising:** [...]
- **First small steps (≤60 min):** [...]
- **Links:** [...]
- **People to talk to:** [...]

## Closing
- **Next steps:** [...]
- **Follow-up plan:** [...]`;

  const focusTemplate = `{
  id: "unique-id",
  name: "Focus Area Name",
  overview: "What this area is trying to achieve...",
  roleShapes: ["Role 1", "Role 2"],
  fitSignals: ["Signal 1", "Signal 2"],
  buckets: {
    quickTaste: { title: "...", cardIds: [...] },
    deeperDive: { ... },
    handsOn: { ... },
    jobBoard: { ... }
  },
  curatedCardIds: [...],
  peopleToTalkToPrompts: [...]
}`;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-glow opacity-50" />
        <div className="container max-w-4xl relative">
          <h1 className="font-display text-3xl md:text-4xl font-medium mb-3">Templates & Tools</h1>
          <p className="text-lg text-muted-foreground">Reference templates for structuring sessions and notes.</p>
        </div>
      </section>

      {/* Templates */}
      <section className="py-8 px-4 pb-20">
        <div className="container max-w-4xl">
          <div className="grid gap-6">
            {/* Wrap Summary Template */}
            <Card className="shadow-soft border-border/50 overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-display text-lg">Wrap Summary Template</CardTitle>
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <CardDescription className="mt-0.5">Standard format for session wrap-up notes</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy(wrapTemplate, 'Wrap Summary Template')}
                    className="hidden sm:flex"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="text-sm bg-muted/50 border border-border/50 p-5 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {wrapTemplate}
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy(wrapTemplate, 'Wrap Summary Template')}
                    className="sm:hidden absolute top-3 right-3"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Focus Area Template */}
            <Card className="shadow-soft border-border/50 overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bucket-deep/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-bucket-deep" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-display text-lg">Focus Area Template</CardTitle>
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <CardDescription className="mt-0.5">Structure for adding new focus areas</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy(focusTemplate, 'Focus Area Template')}
                    className="hidden sm:flex"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="text-sm bg-muted/50 border border-border/50 p-5 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {focusTemplate}
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy(focusTemplate, 'Focus Area Template')}
                    className="sm:hidden absolute top-3 right-3"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
