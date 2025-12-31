import { useParams, Link } from 'react-router-dom';
import { getFocusAreaById } from '@/data/focusAreas';
import { getCardById } from '@/data/cards';
import { BucketTile, BucketTileGrid } from '@/components/BucketTile';
import { RecommendationCard } from '@/components/RecommendationCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function FocusAreaDetail() {
  const { id } = useParams<{ id: string }>();
  const area = getFocusAreaById(id || '');
  const [activeBucket, setActiveBucket] = useState<string | null>(null);

  if (!area) {
    return <div className="container py-12 text-center"><p>Focus area not found.</p><Link to="/focus-areas" className="text-primary hover:underline">Back to Focus Areas</Link></div>;
  }

  const buckets = [
    { key: 'quickTaste', type: 'quick-taste' as const, data: area.buckets.quickTaste },
    { key: 'deeperDive', type: 'deeper-dive' as const, data: area.buckets.deeperDive },
    { key: 'handsOn', type: 'hands-on' as const, data: area.buckets.handsOn },
    { key: 'jobBoard', type: 'job-board' as const, data: area.buckets.jobBoard },
  ];

  return (
    <div className="container max-w-4xl py-8">
      <Button variant="ghost" asChild className="mb-4"><Link to="/focus-areas"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>
      
      <h1 className="font-display text-3xl font-bold mb-2">{area.name}</h1>
      <p className="text-lg text-muted-foreground mb-8">{area.overview}</p>

      {/* Bucket Tiles */}
      <section className="mb-12">
        <h2 className="font-display text-xl font-semibold mb-4">Where to Start</h2>
        <BucketTileGrid>
          {buckets.map(b => (
            <BucketTile key={b.key} type={b.type} title={b.data.title} description={b.data.description} isActive={activeBucket === b.key} onClick={() => setActiveBucket(activeBucket === b.key ? null : b.key)} />
          ))}
        </BucketTileGrid>
      </section>

      {/* Active Bucket Cards */}
      {activeBucket && (
        <section className="mb-12 animate-slide-up">
          <h3 className="font-display text-lg font-semibold mb-4">{buckets.find(b => b.key === activeBucket)?.data.title}</h3>
          {buckets.find(b => b.key === activeBucket)?.data.inlineGuidance && (
            <p className="text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">{buckets.find(b => b.key === activeBucket)?.data.inlineGuidance}</p>
          )}
          <div className="space-y-4">
            {buckets.find(b => b.key === activeBucket)?.data.cardIds.map(cardId => {
              const card = getCardById(cardId);
              return card ? <RecommendationCard key={cardId} card={card} /> : null;
            })}
          </div>
        </section>
      )}

      {/* Fit Signals */}
      <section className="mb-12">
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2"><Check className="h-5 w-5 text-commitment-low" />Fit Signals</h2>
        <ul className="space-y-2">{area.fitSignals.map((s, i) => <li key={i} className="flex gap-2"><span className="text-commitment-low">✓</span>{s}</li>)}</ul>
      </section>

      {/* Role Shapes */}
      <section className="mb-12">
        <h2 className="font-display text-xl font-semibold mb-4">Role Shapes</h2>
        <div className="space-y-2">{area.roleShapes.map((r, i) => <p key={i} className="text-muted-foreground">• {r}</p>)}</div>
      </section>

      {/* Common Confusions */}
      {area.commonConfusions && (
        <section className="mb-12">
          <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-accent" />Common Confusions</h2>
          <ul className="space-y-2">{area.commonConfusions.map((c, i) => <li key={i} className="text-muted-foreground">• {c}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
