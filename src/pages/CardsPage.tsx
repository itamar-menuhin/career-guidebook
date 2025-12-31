import { useSearch } from '@/contexts/SearchContext';
import { RecommendationCard } from '@/components/RecommendationCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeLabels: Record<string, string> = {
  'quick-taste': 'Quick taste (≈1 hour)',
  'deeper-dive': 'Deeper dive (2–6 hours)',
  'hands-on': 'Hands-on trial',
  'job-board': 'Job board scan (real roles)',
};
const typeOptions = ['quick-taste', 'deeper-dive', 'hands-on', 'job-board'];
const topicOptions = ['course', 'program', 'reading', 'job-board', 'project', 'tool', 'person'];
const commitmentOptions = ['low', 'medium', 'high'];

export default function CardsPage() {
  const { query, setQuery, filters, setFilter, clearFilters, filteredCards } = useSearch();
  const hasFilters = filters.type || filters.topic || filters.commitment || query;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-glow opacity-50" />
        <div className="container max-w-5xl relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-bucket-jobs/10 flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-bucket-jobs" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-medium">Recommendation Cards</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">Filterable catalog of all resources across focus areas. Browse and discuss during your sessions.</p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="sticky top-16 z-40 py-4 px-4 glass border-b border-border/40">
        <div className="container max-w-5xl space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search cards by title, description..." 
              className="pl-11 h-11 bg-background/80 border-border/50 focus-visible:border-primary/50"
            />
          </div>
          
          {/* Filter chips */}
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</p>
              <div className="flex flex-wrap gap-1.5">
                {typeOptions.map(t => (
                  <Badge 
                    key={t} 
                    variant={filters.type === t ? 'default' : 'outline'} 
                    className={cn(
                      'cursor-pointer text-xs transition-all duration-200',
                      filters.type === t ? 'shadow-sm' : 'hover:bg-muted/60 border-border/50'
                    )}
                    onClick={() => setFilter('type', filters.type === t ? null : t)}
                  >
                    {typeLabels[t] || t.replace('-', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topic</p>
              <div className="flex flex-wrap gap-1.5">
                {topicOptions.map(t => (
                  <Badge 
                    key={t} 
                    variant={filters.topic === t ? 'default' : 'outline'} 
                    className={cn(
                      'cursor-pointer capitalize text-xs transition-all duration-200',
                      filters.topic === t ? 'shadow-sm' : 'hover:bg-muted/60 border-border/50'
                    )}
                    onClick={() => setFilter('topic', filters.topic === t ? null : t)}
                  >
                    {t.replace('-', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Commitment</p>
              <div className="flex flex-wrap gap-1.5">
                {commitmentOptions.map(c => (
                  <Badge 
                    key={c} 
                    variant={filters.commitment === c ? 'default' : 'outline'} 
                    className={cn(
                      'cursor-pointer capitalize text-xs transition-all duration-200',
                      filters.commitment === c ? 'shadow-sm' : 'hover:bg-muted/60 border-border/50'
                    )}
                    onClick={() => setFilter('commitment', filters.commitment === c ? null : c)}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          {hasFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { clearFilters(); setQuery(''); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1.5" />
              Clear all filters
            </Button>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-8 px-4 pb-20">
        <div className="container max-w-5xl">
          <p className="text-sm text-muted-foreground mb-6">
            {filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'} found
          </p>
          <div className="space-y-4">
            {filteredCards.map((card, index) => (
              <div key={card.id} className={`animate-fade-up stagger-${Math.min(index + 1, 6)}`}>
                <RecommendationCard card={card} />
              </div>
            ))}
            {filteredCards.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No cards match your filters.</p>
                <Button variant="link" onClick={() => { clearFilters(); setQuery(''); }}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
