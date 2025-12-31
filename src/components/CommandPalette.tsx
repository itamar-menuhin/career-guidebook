import { useNavigate } from 'react-router-dom';
import { useSearch } from '@/contexts/SearchContext';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { 
  Target, 
  LayoutGrid, 
  Map, 
  PlayCircle, 
  BookOpen, 
  FileText,
  ArrowRight 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function CommandPalette() {
  const navigate = useNavigate();
  const { isOpen, closeSearch, query, setQuery, results } = useSearch();

  const handleSelect = (path: string) => {
    navigate(path);
    closeSearch();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && closeSearch()}>
      <CommandInput 
        placeholder="Search cards, focus areas, pathways..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Navigation */}
        {!query && (
          <CommandGroup heading="Quick Navigation">
            <CommandItem onSelect={() => handleSelect('/')}>
              <BookOpen className="mr-2 h-4 w-4" />
              Start Here
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/flow')}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Flow guide
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/pathways')}>
              <Map className="mr-2 h-4 w-4" />
              Pathways
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/focus-areas')}>
              <Target className="mr-2 h-4 w-4" />
              Focus Areas
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/cards')}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              Recommendation Cards
            </CommandItem>
            <CommandItem onSelect={() => handleSelect('/templates')}>
              <FileText className="mr-2 h-4 w-4" />
              Templates & Tools
            </CommandItem>
          </CommandGroup>
        )}

        {/* Search Results */}
        {query && results.focusAreas.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Focus Areas">
              {results.focusAreas.map(area => (
                <CommandItem 
                  key={area.id} 
                  onSelect={() => handleSelect(`/focus-areas/${area.id}`)}
                >
                  <Target className="mr-2 h-4 w-4 text-primary" />
                  <span>{area.name}</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {query && results.pathways.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Pathways">
              {results.pathways.map(pathway => (
                <CommandItem 
                  key={pathway.id} 
                  onSelect={() => handleSelect(`/pathways#${pathway.id}`)}
                >
                  <Map className="mr-2 h-4 w-4 text-bucket-deep" />
                  <span>{pathway.name}</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {query && results.cards.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recommendation Cards">
              {results.cards.slice(0, 6).map(card => (
                <CommandItem 
                  key={card.id} 
                  onSelect={() => handleSelect(`/cards#${card.id}`)}
                  className="flex items-start gap-2"
                >
                  <LayoutGrid className="mt-0.5 h-4 w-4 text-bucket-hands shrink-0" />
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-medium">{card.title}</span>
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {card.tags.type.replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {card.tags.topic}
                      </Badge>
                    </div>
                  </div>
                </CommandItem>
              ))}
              {results.cards.length > 6 && (
                <CommandItem onSelect={() => handleSelect('/cards')}>
                  <span className="text-muted-foreground">
                    View all {results.cards.length} cards...
                  </span>
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
