import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Map, Zap } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useContent } from '@/contexts/ContentContext';

export default function PathwaysPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { pathways, loading } = useContent();

  if (loading && pathways.length === 0) {
    return (
      <div className="container max-w-4xl py-12">
        <p className="text-muted-foreground">Loading pathways...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Common Pathways</h1>
        <p className="text-lg text-muted-foreground">Focus-area-agnostic approaches for when someone isn't sure where to start.</p>
      </div>
      {pathways.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-muted-foreground">
          No pathways available yet.
        </div>
      ) : (
        <div className="space-y-4">
          {pathways.map(pathway => (
            <Collapsible key={pathway.id} open={expanded[pathway.id]} onOpenChange={() => setExpanded(p => ({ ...p, [pathway.id]: !p[pathway.id] }))}>
              <Card className="shadow-soft" id={pathway.id}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Map className="h-5 w-5 text-bucket-deep mt-0.5" />
                        <div>
                          <CardTitle className="text-lg">{pathway.name}</CardTitle>
                          <CardDescription className="mt-1">{pathway.description}</CardDescription>
                        </div>
                      </div>
                      <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', expanded[pathway.id] && 'rotate-180')} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div><p className="text-sm font-medium mb-1">When to Suggest</p><p className="text-sm text-muted-foreground">{pathway.whenToSuggest}</p></div>
                    <div><p className="text-sm font-medium mb-2">Fit Test Prompts</p><ul className="space-y-1">{pathway.fitTestPrompts.map((p, i) => <li key={i} className="text-sm text-muted-foreground">• {p}</li>)}</ul></div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-sm font-medium text-primary mb-1 flex items-center gap-1"><Zap className="h-4 w-4" />Default First Step</p>
                      <p className="text-sm">{pathway.defaultFirstSmallStep}</p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
