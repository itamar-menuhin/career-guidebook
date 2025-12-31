import { useSearch } from '@/contexts/SearchContext';
import { RecommendationCard } from '@/components/RecommendationCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeOptions = ['quick-taste', 'deeper-dive', 'hands-on', 'job-board'];
const topicOptions = ['course', 'program', 'reading', 'job-board', 'project', 'tool', 'person'];
const commitmentOptions = ['low', 'medium', 'high'];

export default function CardsPage() {
  const { query, setQuery, filters, setFilter, clearFilters, filteredCards } = useSearch();
  const hasFilters = filters.type || filters.topic || filters.commitment || query;

  return (
    <div className="container max-w-5xl py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Recommendation Cards</h1>
        <p className="text-lg text-muted-foreground">Filterable catalog of all resources across focus areas.</p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cards..." className="pl-10" />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Type</p>
            <div className="flex flex-wrap gap-1">
              {typeOptions.map(t => (
                <Badge key={t} variant={filters.type === t ? 'default' : 'outline'} className="cursor-pointer capitalize" onClick={() => setFilter('type', filters.type === t ? null : t)}>
                  {t.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Topic</p>
            <div className="flex flex-wrap gap-1">
              {topicOptions.map(t => (
                <Badge key={t} variant={filters.topic === t ? 'default' : 'outline'} className="cursor-pointer capitalize" onClick={() => setFilter('topic', filters.topic === t ? null : t)}>
                  {t.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Commitment</p>
            <div className="flex flex-wrap gap-1">
              {commitmentOptions.map(c => (
                <Badge key={c} variant={filters.commitment === c ? 'default' : 'outline'} className="cursor-pointer capitalize" onClick={() => setFilter('commitment', filters.commitment === c ? null : c)}>
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { clearFilters(); setQuery(''); }}><X className="h-4 w-4 mr-1" />Clear filters</Button>
        )}
      </div>

      {/* Results */}
      <p className="text-sm text-muted-foreground mb-4">{filteredCards.length} cards</p>
      <div className="space-y-4">
        {filteredCards.map(card => <RecommendationCard key={card.id} card={card} />)}
      </div>
    </div>
  );
}
