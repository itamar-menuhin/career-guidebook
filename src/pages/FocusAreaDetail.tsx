import { useParams, Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { getFocusAreaById } from '@/data/focusAreas';
import { getCardById } from '@/data/cards';
import { BucketTile, BucketTileGrid } from '@/components/BucketTile';
import { RecommendationCard } from '@/components/RecommendationCard';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Check, 
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function FocusAreaDetail() {
  const { id } = useParams<{ id: string }>();
  const area = getFocusAreaById(id || '');
  const [activeBucket, setActiveBucket] = useState<string | null>(null);
  const [expandedBuckets, setExpandedBuckets] = useState<Record<string, boolean>>({});
  const bucketSectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (activeBucket && bucketSectionRefs.current[activeBucket]) {
      const timeout = window.setTimeout(() => {
        bucketSectionRefs.current[activeBucket]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 60);

      return () => window.clearTimeout(timeout);
    }
  }, [activeBucket]);

  if (!area) {
    return (
      <div className="container py-12 text-center">
        <p>Focus area not found.</p>
        <Link to="/focus-areas" className="text-primary hover:underline">Back to Focus Areas</Link>
      </div>
    );
  }

  const buckets = [
    { key: 'quickTaste', type: 'quick-taste' as const, data: area.buckets.quickTaste },
    { key: 'deeperDive', type: 'deeper-dive' as const, data: area.buckets.deeperDive },
    { key: 'handsOn', type: 'hands-on' as const, data: area.buckets.handsOn },
    { key: 'jobBoard', type: 'job-board' as const, data: area.buckets.jobBoard },
  ];

  const handleBucketClick = (bucketKey: string) => {
    setExpandedBuckets(prev => ({ ...prev, [bucketKey]: true }));
    setActiveBucket(bucketKey);
    requestAnimationFrame(() => {
      bucketSectionRefs.current[bucketKey]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const handleToggleBucket = (bucketKey: string, nextOpen: boolean) => {
    setExpandedBuckets(prev => ({ ...prev, [bucketKey]: nextOpen }));
    if (nextOpen) {
      setActiveBucket(bucketKey);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/focus-areas">
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Link>
      </Button>
      
      <h1 className="font-display text-3xl font-bold mb-2">{area.name}</h1>
      <p className="text-lg text-muted-foreground mb-8">{area.overview}</p>

      {/* Bucket Tiles - Sticky on scroll */}
      <section className="mb-8 sticky top-16 z-10 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b border-border/30">
        <h2 className="font-display text-xl font-semibold mb-4">Where to Start</h2>
        <BucketTileGrid>
          {buckets.map(b => (
            <BucketTile 
              key={b.key} 
              type={b.type} 
              title={b.data.title} 
              description={b.data.description} 
              isActive={activeBucket === b.key || expandedBuckets[b.key]} 
              onClick={() => handleBucketClick(b.key)} 
            />
          ))}
        </BucketTileGrid>
      </section>

      {/* Bucket Content Sections */}
      <div className="space-y-12">
        {buckets.map(b => (
          <Collapsible
            key={b.key}
            open={!!expandedBuckets[b.key]}
            onOpenChange={(open) => handleToggleBucket(b.key, open)}
          >
            <section 
              id={`bucket-${b.key}`}
              ref={(el) => { bucketSectionRefs.current[b.key] = el; }}
              className={`scroll-mt-72 transition-all duration-300 ${
                activeBucket === b.key ? 'opacity-100' : activeBucket ? 'opacity-50' : 'opacity-100'
              }`}
            >
              <div className="rounded-2xl border border-border/60 bg-card/60 p-5 md:p-6 shadow-soft space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs uppercase text-muted-foreground tracking-wider">Bucket</p>
                    <h3 className="font-display text-lg font-semibold">{b.data.title}</h3>
                    {b.data.inlineGuidance && (
                      <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                        {b.data.inlineGuidance}
                      </p>
                    )}
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="inline-flex items-center gap-2"
                      onClick={() => setActiveBucket(b.key)}
                    >
                      {expandedBuckets[b.key] ? 'Collapse' : 'Expand'}
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedBuckets[b.key] ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="space-y-4 pt-1 animate-fade-in">
                  <div className="space-y-4">
                    {b.data.cardIds.map(cardId => {
                      const card = getCardById(cardId);
                      return card ? <RecommendationCard key={cardId} card={card} /> : null;
                    })}
                    {b.data.cardIds.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No cards in this bucket yet.</p>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </section>
          </Collapsible>
        ))}
      </div>

      {/* Fit Signals */}
      <section className="mt-12 mb-12">
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          <Check className="h-5 w-5 text-commitment-low" />
          Good Fit If…
        </h2>
        <ul className="space-y-2">
          {area.fitSignals.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-commitment-low">✓</span>{s}
            </li>
          ))}
        </ul>
      </section>

      {/* Role Shapes */}
      <section className="mb-12">
        <h2 className="font-display text-xl font-semibold mb-4">Role Shapes</h2>
        <div className="space-y-2">
          {area.roleShapes.map((r, i) => (
            <p key={i} className="text-muted-foreground">• {r}</p>
          ))}
        </div>
      </section>

      {/* Common Confusions */}
      {area.commonConfusions && (
        <section className="mb-12">
          <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-accent" />
            Common Confusions
          </h2>
          <ul className="space-y-2">
            {area.commonConfusions.map((c, i) => (
              <li key={i} className="text-muted-foreground">• {c}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
