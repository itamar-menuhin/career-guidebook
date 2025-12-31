import { z } from 'zod';
import {
  RecommendationCard,
  FocusArea,
  CommonPathway,
  FlowStep,
  Template,
  RecommendationCardSchema,
  FocusAreaSchema,
  CommonPathwaySchema,
  FlowStepSchema,
  TemplateSchema,
} from './contentTypes';

type ContentKey = 'cards' | 'focusAreas' | 'pathways' | 'flow' | 'templates';

const basePath =
  (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
const withBase = (path: string) => `${basePath.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

const contentPaths: Record<ContentKey, string> = {
  cards: withBase('content/cards.json'),
  focusAreas: withBase('content/focus-areas.json'),
  pathways: withBase('content/pathways.json'),
  flow: withBase('content/flow.json'),
  templates: withBase('content/templates.json'),
};

const schemas: Record<ContentKey, z.ZodTypeAny> = {
  cards: z.array(RecommendationCardSchema),
  focusAreas: z.array(FocusAreaSchema),
  pathways: z.array(CommonPathwaySchema),
  flow: z.array(FlowStepSchema),
  templates: z.array(TemplateSchema),
};

export type ContentErrorCode = 'missing-file' | 'invalid-json' | 'validation';

export class ContentLoadError extends Error {
  code: ContentErrorCode;
  details?: unknown;

  constructor(message: string, code: ContentErrorCode, details?: unknown) {
    super(message);
    this.name = 'ContentLoadError';
    this.code = code;
    this.details = details;
  }
}

const cache = new Map<ContentKey, Promise<unknown>>();

async function loadContentFile<T>(key: ContentKey): Promise<T> {
  if (cache.has(key)) {
    return cache.get(key) as Promise<T>;
  }

  const loader = (async () => {
    const response = await fetch(contentPaths[key]);

    if (!response.ok) {
      const error = new ContentLoadError(
        `Unable to load ${key} content (HTTP ${response.status})`,
        'missing-file',
        { status: response.status }
      );
      if (import.meta?.env?.DEV) {
        console.error(error.message);
      }
      throw error;
    }

    let jsonData: unknown;
    try {
      jsonData = await response.json();
    } catch (err) {
      const error = new ContentLoadError(
        `Invalid JSON in ${contentPaths[key]}`,
        'invalid-json',
        err
      );
      if (import.meta?.env?.DEV) {
        console.error(error.message, err);
      }
      throw error;
    }

    const parsed = schemas[key].safeParse(jsonData);
    if (!parsed.success) {
      if (import.meta?.env?.DEV) {
        console.error(`Content validation failed for ${key}:`, parsed.error.format());
      }
      throw new ContentLoadError(
        `Validation failed for ${key}`,
        'validation',
        parsed.error
      );
    }

    return parsed.data as T;
  })().catch(err => {
    cache.delete(key);
    throw err;
  });

  cache.set(key, loader);
  return loader;
}

export function clearContentCache() {
  cache.clear();
}

export function getRecommendationCards(): Promise<RecommendationCard[]> {
  return loadContentFile('cards');
}

export function getFocusAreas(): Promise<FocusArea[]> {
  return loadContentFile('focusAreas');
}

export function getCommonPathways(): Promise<CommonPathway[]> {
  return loadContentFile('pathways');
}

export function getFlowSteps(): Promise<FlowStep[]> {
  return loadContentFile('flow');
}

export function getTemplates(): Promise<Template[]> {
  return loadContentFile('templates');
}

export async function loadAllContent() {
  const [cards, focusAreas, pathways, flowSteps, templates] = await Promise.all([
    getRecommendationCards(),
    getFocusAreas(),
    getCommonPathways(),
    getFlowSteps(),
    getTemplates(),
  ]);

  return {
    cards,
    focusAreas,
    pathways,
    flowSteps,
    templates,
  };
}
