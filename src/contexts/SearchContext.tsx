import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { RecommendationCard, FocusArea, CommonPathway, FlowStep } from '@/lib/contentTypes';
import { useContent } from '@/contexts/ContentContext';

interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  results: {
    cards: RecommendationCard[];
    focusAreas: FocusArea[];
    pathways: CommonPathway[];
    flowSteps: FlowStep[];
  };
  filters: {
    type: string | null;
    topic: string | null;
    commitment: string | null;
    focusArea: string | null;
  };
  setFilter: (key: 'type' | 'topic' | 'commitment' | 'focusArea', value: string | null) => void;
  clearFilters: () => void;
  filteredCards: RecommendationCard[];
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const { cards, focusAreas, pathways, flowSteps } = useContent();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<{
    type: string | null;
    topic: string | null;
    commitment: string | null;
    focusArea: string | null;
  }>({
    type: null,
    topic: null,
    commitment: null,
    focusArea: null,
  });

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);
  const toggleSearch = useCallback(() => setIsOpen(prev => !prev), []);

  const setFilter = useCallback((key: 'type' | 'topic' | 'commitment' | 'focusArea', value: string | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ type: null, topic: null, commitment: null, focusArea: null });
  }, []);

  const searchCards = useCallback(
    (term: string) => {
      const lowerQuery = term.toLowerCase();
      return cards.filter(card =>
        card.title.toLowerCase().includes(lowerQuery) ||
        card.oneLiner.toLowerCase().includes(lowerQuery) ||
        card.tags.topic.toLowerCase().includes(lowerQuery) ||
        card.tags.goodFitIf.some(fit => fit.toLowerCase().includes(lowerQuery))
      );
    },
    [cards]
  );

  const results = useMemo(() => {
    if (!query.trim()) {
      return { cards: [] as RecommendationCard[], focusAreas: [] as FocusArea[], pathways: [] as CommonPathway[], flowSteps: [] as FlowStep[] };
    }
    const lowerQuery = query.toLowerCase();
    return {
      cards: searchCards(query),
      focusAreas: focusAreas.filter(fa =>
        fa.name.toLowerCase().includes(lowerQuery) ||
        fa.overviewPlainText.toLowerCase().includes(lowerQuery) ||
        (fa.overviewExcerpt ?? '').toLowerCase().includes(lowerQuery)
      ),
      pathways: pathways.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery)
      ),
      flowSteps: flowSteps.filter(step =>
        step.title.toLowerCase().includes(lowerQuery) ||
        step.shortTitle.toLowerCase().includes(lowerQuery) ||
        (step.summary ?? '').toLowerCase().includes(lowerQuery) ||
        step.contentPlainText.toLowerCase().includes(lowerQuery)
      ),
    };
  }, [flowSteps, focusAreas, pathways, query, searchCards]);

  const filteredCards = useMemo(() => {
    const matchingCards = query ? searchCards(query) : cards;
    return matchingCards.filter(card => {
      if (filters.type && card.tags.type !== filters.type) return false;
      if (filters.topic && card.tags.topic !== filters.topic) return false;
      if (filters.commitment && card.tags.commitment !== filters.commitment) return false;
      if (filters.focusArea && !card.focusAreaIds.includes(filters.focusArea)) return false;
      return true;
    });
  }, [cards, filters.commitment, filters.topic, filters.type, filters.focusArea, query, searchCards]);

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        isOpen,
        openSearch,
        closeSearch,
        toggleSearch,
        results,
        filters,
        setFilter,
        clearFilters,
        filteredCards,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
