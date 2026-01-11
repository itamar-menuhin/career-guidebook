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

const bucketLabelMap = {
  quickTaste: 'Quick taste (≈1 hour)',
  deeperDive: 'Deeper dive (2–6 hours)',
  handsOn: 'Hands-on trial',
  jobBoard: 'Job board scan (real roles)',
} as const;

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
    <div className="container max-w-4xl py-12">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/focus-areas">
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="text-lg">Back</span>
        </Link>
      </Button>

      {/* Hero / Overview */}
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 text-foreground leading-tight">{area.name}</h1>
      <div className="mb-12">
        <MarkdownPage
          content={area.overview}
          className="prose-p:text-xl prose-p:leading-relaxed prose-p:text-muted-foreground prose-strong:text-foreground/90 max-w-none"
        />
      </div>

      {/* Fit Signals */}
      <section className="mb-16 border-t border-border/40 pt-10">
        <h2 className="font-display text-3xl font-semibold mb-8">
          Good fit if…
        </h2>
        <ul className="space-y-4">
          {area.fitSignals.map((s, i) => (
            <li key={i} className="flex gap-4 text-xl leading-relaxed items-baseline">
              <span className="text-foreground shrink-0">•</span>
              <span className="text-muted-foreground">{s}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Role Shapes */}
      <section className="mb-16">
        <h2 className="font-display text-3xl font-semibold mb-8">Role Shapes</h2>
        <ul className="space-y-4">
          {area.roleShapes.map((r, i) => {
            // Simple inline bold parser: splits by ** to render bold parts
            const parts = r.split(/(\*\*.*?\*\*)/g);
            return (
              <li key={i} className="flex gap-4 text-xl leading-relaxed items-baseline">
                <span className="text-foreground shrink-0">•</span>
                <span className="text-muted-foreground">
                  {parts.map((part, index) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return (
                        <span key={index} className="font-bold text-foreground/90">
                          {part.slice(2, -2)}
                        </span>
                      );
                    }
                    return <span key={index}>{part}</span>;
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Common Confusions */}
      {area.commonConfusions && area.commonConfusions.length > 0 && (
        <section className="mb-16">
          <h2 className="font-display text-3xl font-semibold mb-8">
            Common Confusions
          </h2>
          <ul className="space-y-4">
            {area.commonConfusions.map((c, i) => (
              <li key={i} className="flex gap-4 text-xl leading-relaxed items-baseline text-muted-foreground">
                <span className="text-foreground shrink-0">•</span>
                <span className="text-muted-foreground">{c}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Bucket Content Sections */}
      <div className="space-y-12 pb-32">
        <h2 className="font-display text-3xl font-semibold mb-8">Where to Start</h2>
        {buckets.map(b => (
          <Collapsible
            key={b.key}
            open={!!expandedBuckets[b.key]}
            onOpenChange={(open) => handleToggleBucket(b.key, open)}
          >
            <section
              id={buildBucketAnchor(b.key)}
              ref={(el) => { bucketSectionRefs.current[b.key] = el; }}
              className={`scroll-mt-32 transition-all duration-500 ease-in-out ${activeBucket === b.key ? 'opacity-100 translate-y-0' : activeBucket ? 'opacity-60' : 'opacity-100'
                }`}
            >
              <div className="rounded-2xl border border-border/60 bg-card/40 hover:bg-card/80 transition-colors duration-300 p-6 md:p-8 shadow-sm hover:shadow-md space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <h3 className="font-display text-2xl font-bold text-foreground">{b.data.title}</h3>

                    {/* Collapsed Preview: Show Card Titles if not expanded */}
                    {!expandedBuckets[b.key] && b.data.cardIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {b.data.cardIds.slice(0, 3).map(cardId => {
                          const card = lookupCard(cardId);
                          if (!card) return null;
                          return (
                            <div key={cardId} className="inline-flex items-center px-3 py-1 rounded-full text-base font-medium bg-muted text-muted-foreground border border-border/50">
                              {card.title}
                            </div>
                          );
                        })}
                        {b.data.cardIds.length > 3 && (
                          <span className="text-base text-muted-foreground self-center">+{b.data.cardIds.length - 3} more</span>
                        )}
                      </div>
                    )}

                    {b.data.inlineGuidanceMarkdown ? (
                      <div className="hidden"></div>
                    ) : null}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="inline-flex items-center gap-2 h-10 px-4 text-base font-medium"
                        onClick={() => setActiveBucket(b.key)}
                      >
                        {expandedBuckets[b.key] ? 'Collapse' : 'Expand'}
                        <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${expandedBuckets[b.key] ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>

                <CollapsibleContent className="space-y-6 pt-2 animate-fade-in text-lg">
                  {b.data.inlineGuidanceMarkdown ? (
                    <div className="p-5 bg-muted/40 rounded-xl border border-border/40">
                      <MarkdownPage
                        content={b.data.inlineGuidanceMarkdown}
                        className="prose-p:text-lg prose-p:text-muted-foreground/90 prose-li:text-muted-foreground/90 prose-ul:my-2 prose-p:my-1"
                      />
                    </div>
                  ) : b.data.inlineGuidance ? (
                    <p className="text-lg text-muted-foreground p-5 bg-muted/40 rounded-xl border border-border/40">
                      {b.data.inlineGuidance}
                    </p>
                  ) : null}

                  {b.data.descriptionMarkdown && (
                    <MarkdownPage
                      content={b.data.descriptionMarkdown}
                      className="prose-p:text-muted-foreground prose-li:text-muted-foreground prose-p:text-lg prose-li:text-lg"
                    />
                  )}
                  <div className="space-y-6 pt-4">
                    {b.data.cardIds.map(cardId => renderCard(cardId))}
                    {b.data.cardIds.length === 0 && (
                      <p className="text-lg text-muted-foreground italic py-4">No cards in this bucket yet.</p>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </section>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
