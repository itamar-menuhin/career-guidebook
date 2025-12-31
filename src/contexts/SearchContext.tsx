import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { RecommendationCard, FocusArea, CommonPathway } from '@/data/types';
import { recommendationCards, searchCards } from '@/data/cards';
import { focusAreas } from '@/data/focusAreas';
import { commonPathways } from '@/data/pathways';

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
  };
  filters: {
    type: string | null;
    topic: string | null;
    commitment: string | null;
  };
  setFilter: (key: 'type' | 'topic' | 'commitment', value: string | null) => void;
  clearFilters: () => void;
  filteredCards: RecommendationCard[];
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<{
    type: string | null;
    topic: string | null;
    commitment: string | null;
  }>({
    type: null,
    topic: null,
    commitment: null,
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

  const setFilter = useCallback((key: 'type' | 'topic' | 'commitment', value: string | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ type: null, topic: null, commitment: null });
  }, []);

  // Search results
  const results = {
    cards: query ? searchCards(query) : [],
    focusAreas: query
      ? focusAreas.filter(fa =>
          fa.name.toLowerCase().includes(query.toLowerCase()) ||
          fa.overview.toLowerCase().includes(query.toLowerCase())
        )
      : [],
    pathways: query
      ? commonPathways.filter(p =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
        )
      : [],
  };

  // Filtered cards (for the cards page)
  const filteredCards = recommendationCards.filter(card => {
    if (filters.type && card.tags.type !== filters.type) return false;
    if (filters.topic && card.tags.topic !== filters.topic) return false;
    if (filters.commitment && card.tags.commitment !== filters.commitment) return false;
    if (query && !searchCards(query).find(c => c.id === card.id)) return false;
    return true;
  });

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
