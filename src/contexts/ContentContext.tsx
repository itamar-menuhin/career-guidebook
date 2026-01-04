import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ContentLoadError, clearContentCache, loadAllContent } from '@/lib/contentLoader';
import type {
  RecommendationCard,
  FocusArea,
  CommonPathway,
  FlowStep,
  Template,
} from '@/lib/contentTypes';

interface ContentContextValue {
  cards: RecommendationCard[];
  focusAreas: FocusArea[];
  pathways: CommonPathway[];
  flowSteps: FlowStep[];
  templates: Template[];
  loading: boolean;
  error: Error | null;
  hasLoaded: boolean;
  refresh: () => Promise<void>;
}

const ContentContext = createContext<ContentContextValue | undefined>(undefined);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<RecommendationCard[]>([]);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [pathways, setPathways] = useState<CommonPathway[]>([]);
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await loadAllContent();
      setCards(data.cards);
      setFocusAreas(data.focusAreas);
      setPathways(data.pathways);
      setFlowSteps(data.flowSteps);
      setTemplates(data.templates);
      setHasLoaded(true);
    } catch (err) {
      setError(err as ContentLoadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => clearContentCache();
  }, [refresh]);

  const value = useMemo(
    () => ({
      cards,
      focusAreas,
      pathways,
      flowSteps,
      templates,
      loading,
      error,
      hasLoaded,
      refresh,
    }),
    [cards, focusAreas, pathways, flowSteps, templates, loading, error, hasLoaded, refresh]
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return ctx;
}

export function useCardLookup() {
  const { cards } = useContent();
  const warned = useRef(new Set<string>());

  const map = useMemo(() => new Map(cards.map(card => [card.id, card])), [cards]);

  return useCallback(
    (id: string) => {
      const card = map.get(id);
      if (!card && import.meta?.env?.DEV && !warned.current.has(id)) {
        console.warn(`Missing card for id "${id}" referenced in content JSON.`);
        warned.current.add(id);
      }
      return card;
    },
    [map]
  );
}
