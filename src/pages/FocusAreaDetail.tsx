import { useParams, Link, useLocation } from 'react-router-dom';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useContent, useCardLookup } from '@/contexts/ContentContext';
import { BucketTile, BucketTileGrid } from '@/components/BucketTile';
import { RecommendationCard } from '@/components/RecommendationCard';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Check, 
  AlertTriangle,
  ChevronDown,
  Link as LinkIcon,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { buildBucketAnchor } from '@/lib/anchors';
import { MarkdownPage } from '@/components/MarkdownPage';

export default function FocusAreaDetail() {
  const { id } = useParams<{ id: string }>();
  const { focusAreas, loading } = useContent();
  const lookupCard = useCardLookup();
  const area = useMemo(() => focusAreas.find(focusArea => focusArea.id === (id || '')), [focusAreas, id]);
  const [activeBucket, setActiveBucket] = useState<string | null>(null);
  const [expandedBuckets, setExpandedBuckets] = useState<Record<string, boolean>>({});
  const bucketSectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const location = useLocation();
  const { toast } = useToast();
  const buckets = useMemo(
    () =>
      area
        ? [
            { key: 'quickTaste', type: 'quick-taste' as const, data: area.buckets.quickTaste },
            { key: 'deeperDive', type: 'deeper-dive' as const, data: area.buckets.deeperDive },
            { key: 'handsOn', type: 'hands-on' as const, data: area.buckets.handsOn },
            { key: 'jobBoard', type: 'job-board' as const, data: area.buckets.jobBoard },
          ]
        : [],
    [area]
  );

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

  useEffect(() => {
    const targetId = decodeURIComponent(location.hash.replace('#', ''));
    if (!targetId) return;

    const matched = buckets.find(bucket => buildBucketAnchor(bucket.key) === targetId);
    if (matched) {
      setExpandedBuckets(prev => ({ ...prev, [matched.key]: true }));
      setActiveBucket(matched.key);
    }
  }, [location.hash, buckets]);

  if (loading && !area) {
    return (
      <div className="container py-12 text-center text-muted-foreground">
        Loading focus area...
      </div>
    );
  }

  if (!area) {
    return (
      <div className="container py-12 text-center">
        <p>Focus area not found.</p>
        <Link to="/focus-areas" className="text-primary hover:underline">Back to Focus Areas</Link>
      </div>
    );
  }

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

  const copyBucketLink = (bucketKey: string) => {
    const url = `${window.location.origin}/focus-areas/${area?.id ?? ''}#${buildBucketAnchor(bucketKey)}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied',
      description: 'Bucket link copied to clipboard',
    });
  };

  const renderCard = (cardId: string) => {
    const card = lookupCard(cardId);
    if (!card) {
      return (
        <div
          key={cardId}
          className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground"
        >
          Card "{cardId}" is missing from the content library.
        </div>
      );
    }
    return <RecommendationCard key={cardId} card={card} />;
  };

  return (
    <div className="container max-w-4xl py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/focus-areas">
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Link>
      </Button>
      
      <h1 className="font-display text-3xl font-bold mb-2">{area.name}</h1>
      <div className="mb-8">
        <MarkdownPage 
          content={area.overview} 
          className="prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground"
        />
      </div>

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
              id={buildBucketAnchor(b.key)}
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
                    {b.data.inlineGuidanceMarkdown ? (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <MarkdownPage 
                          content={b.data.inlineGuidanceMarkdown} 
                          className="prose-p:text-muted-foreground prose-li:text-muted-foreground prose-ul:my-2 prose-p:my-2"
                        />
                      </div>
                    ) : b.data.inlineGuidance ? (
                      <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                        {b.data.inlineGuidance}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="inline-flex items-center gap-2"
                      onClick={() => copyBucketLink(b.key)}
                      title="Copy link to this bucket"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      Copy link
                    </Button>
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
                </div>

                <CollapsibleContent className="space-y-4 pt-1 animate-fade-in">
                  {b.data.descriptionMarkdown && (
                    <MarkdownPage 
                      content={b.data.descriptionMarkdown}
                      className="prose-p:text-muted-foreground prose-li:text-muted-foreground"
                    />
                  )}
                  <div className="space-y-4">
                    {b.data.cardIds.map(cardId => renderCard(cardId))}
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
