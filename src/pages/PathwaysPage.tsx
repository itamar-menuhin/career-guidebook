import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Map, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useContent } from '@/contexts/ContentContext';
import { MarkdownPage } from '@/components/MarkdownPage';
import { buildPathwayAnchor } from '@/lib/anchors';

export default function PathwaysPage() {
  const { pathways, loading } = useContent();
  const location = useLocation();
  const [selectedPathwayId, setSelectedPathwayId] = useState<string | null>(null);

  useEffect(() => {
    if (pathways.length > 0 && !selectedPathwayId) {
      // Check for hash
      const targetId = decodeURIComponent(location.hash.replace('#', ''));
      const matched = pathways.find(pathway => buildPathwayAnchor(pathway.id) === targetId);

      if (matched) {
        setSelectedPathwayId(matched.id);
      } else {
        // Default to first
        setSelectedPathwayId(pathways[0].id);
      }
    }
  }, [pathways, location.hash, selectedPathwayId]);

  if (loading && pathways.length === 0) {
    return (
      <div className="container max-w-4xl py-12">
        <p className="text-muted-foreground text-lg">Loading pathways...</p>
      </div>
    );
  }

  const selectedPathway = pathways.find(p => p.id === selectedPathwayId);

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold mb-3">Common Pathways</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">Focus-area-agnostic approaches for when someone isn't sure where to start.</p>
      </div>

      {pathways.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-muted-foreground text-lg">
          No pathways available yet.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Grouped Pathways */}
          <div className="space-y-10">
            {(() => {
              const groupOrder = [
                "Explore and learn",
                "Projects and doing",
                "Role change",
                "Additional paths"
              ];

              const grouped = pathways.reduce((acc, pathway) => {
                const group = pathway.group || "Other";
                if (!acc[group]) acc[group] = [];
                acc[group].push(pathway);
                return acc;
              }, {} as Record<string, typeof pathways>);

              // Get all groups, ensuring defined order comes first
              const allGroups = [
                ...groupOrder.filter(g => grouped[g]),
                ...Object.keys(grouped).filter(g => !groupOrder.includes(g))
              ];

              return allGroups.map(groupName => (
                <div key={groupName} className="space-y-4">
                  <h3 className="text-2xl font-semibold text-foreground/80 border-b pb-2 border-border/40">
                    {groupName}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {grouped[groupName].map(pathway => {
                      const isActive = selectedPathwayId === pathway.id;
                      return (
                        <button
                          key={pathway.id}
                          onClick={() => {
                            setSelectedPathwayId(pathway.id);
                            window.history.replaceState(null, '', `#${buildPathwayAnchor(pathway.id)}`);
                          }}
                          className={cn(
                            "px-4 py-2 rounded-full text-base font-medium transition-all duration-300 border",
                            isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-md transform scale-105"
                              : "bg-background text-muted-foreground border-border/60 hover:border-primary/40 hover:bg-muted/30"
                          )}
                        >
                          {pathway.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Active Content Area */}
          <div className="min-h-[400px]">
            {selectedPathway && (
              <Card className="shadow-soft animate-fade-up border-border/50">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-start gap-4">
                    <Map className="h-8 w-8 text-bucket-deep mt-1 shrink-0" />
                    <div>
                      <CardTitle className="text-3xl font-display mb-3">{selectedPathway.name}</CardTitle>
                      {selectedPathway.description && (
                        <CardDescription className="text-xl leading-relaxed text-muted-foreground">
                          {selectedPathway.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-6 space-y-8 md:pl-20">
                  {/* Main Content */}
                  {selectedPathway.content ? (
                    <MarkdownPage
                      content={selectedPathway.content}
                      className="prose-p:text-xl prose-p:text-muted-foreground prose-li:text-xl prose-li:text-muted-foreground max-w-none"
                    />
                  ) : (
                    <p className="text-xl text-muted-foreground italic">No content available for this pathway.</p>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-border/40">
                    {selectedPathway.whenToSuggest && (
                      <div className="space-y-3">
                        <p className="text-lg font-medium text-foreground">When to Suggest</p>
                        <p className="text-lg text-muted-foreground leading-relaxed">{selectedPathway.whenToSuggest}</p>
                      </div>
                    )}

                    {selectedPathway.fitTestPrompts && selectedPathway.fitTestPrompts.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-lg font-medium text-foreground">Fit Test Prompts</p>
                        <ul className="space-y-2">
                          {selectedPathway.fitTestPrompts.map((p, i) => (
                            <li key={i} className="text-lg text-muted-foreground leading-relaxed flex items-start gap-3">
                              <span className="text-primary mt-1.5">•</span>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Default Step */}
                  {selectedPathway.defaultFirstSmallStep && (
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 mt-6">
                      <p className="text-lg font-medium text-primary mb-3 flex items-center gap-2">
                        <Zap className="h-6 w-6" />
                        Default first small step (≤60 min)
                      </p>
                      <p className="text-xl leading-relaxed text-foreground/80">{selectedPathway.defaultFirstSmallStep}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
