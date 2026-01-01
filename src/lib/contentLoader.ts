import { z } from 'zod';
import {
  RecommendationCard,
  FocusArea,
  FocusAreaManifest,
  CommonPathway,
  FlowStep,
  FlowStepManifest,
  Template,
  TemplateManifest,
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
  cards: withBase('content/data/cards.json'),
  focusAreas: withBase('content/data/focus-areas.json'),
  pathways: withBase('content/data/pathways.json'),
  flow: withBase('content/data/flow.json'),
  templates: withBase('content/data/templates.json'),
};

const schemas: Record<ContentKey, z.ZodTypeAny> = {
  cards: z.array(RecommendationCardSchema),
  focusAreas: z.array(FocusAreaSchema),
  pathways: z.array(CommonPathwaySchema),
  flow: z.array(FlowStepSchema),
  templates: z.array(TemplateSchema),
};

export type ContentErrorCode = 'missing-file' | 'invalid-json' | 'validation' | 'missing-markdown';

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
      if (import.meta.env?.DEV) {
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
      if (import.meta.env?.DEV) {
        console.error(error.message, err);
      }
      throw error;
    }

    const parsed = schemas[key].safeParse(jsonData);
    if (!parsed.success) {
      if (import.meta.env?.DEV) {
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

const normalizeContentPath = (path: string) => {
  const cleaned = path.replace(/\\/g, '/').replace(/^\.\//, '');
  return cleaned.startsWith('content/') ? cleaned : `content/${cleaned}`;
};

const markdownCache = new Map<string, Promise<string>>();

async function loadMarkdown(path: string, context: ContentKey) {
  const normalized = normalizeContentPath(path);
  if (markdownCache.has(normalized)) {
    return markdownCache.get(normalized) as Promise<string>;
  }

  const stripGeneratedHeader = (content: string) => {
    const stripped = content
      .replace(/^# GENERATED FILE - DO NOT EDIT MANUALLY\s*\n+/i, '')
      .replace(/^# GENERATED FROM VAULT[^\n]*\n+/i, '');
    
    // Safety check in dev mode: verify headers were stripped
    if (import.meta.env?.DEV) {
      if (stripped.startsWith('# GENERATED')) {
        console.warn(
          `[contentLoader] Markdown content still starts with GENERATED header after stripping. Path: ${normalized}`,
          stripped.substring(0, 100)
        );
      }
    }
    
    return stripped;
  };

  const loader = (async () => {
    const response = await fetch(withBase(normalized));
    if (!response.ok) {
      const error = new ContentLoadError(
        `Missing markdown content at path "${normalized}" for ${context}`,
        'missing-markdown',
        { path: normalized, status: response.status }
      );
      if (import.meta.env?.DEV) {
        console.error(error.message);
      }
      throw error;
    }

    const text = await response.text();
    return stripGeneratedHeader(text);
  })().catch(err => {
    markdownCache.delete(normalized);
    throw err;
  });

  markdownCache.set(normalized, loader);
  return loader;
}

function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/```([\s\S]*?)```/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[#>*_~]/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function clearContentCache() {
  cache.clear();
  markdownCache.clear();
}

export function getRecommendationCards(): Promise<RecommendationCard[]> {
  return loadContentFile('cards');
}

export async function getFocusAreas(): Promise<FocusArea[]> {
  const manifests = await loadContentFile<FocusAreaManifest[]>('focusAreas');

  return Promise.all(
    manifests.map(async focusArea => {
      const overview = await loadMarkdown(focusArea.overviewPath, 'focusAreas');
      const overviewPlainText = markdownToPlainText(overview);

      const mapBucket = async (
        bucket: FocusAreaManifest['buckets'][keyof FocusAreaManifest['buckets']]
      ) => ({
        ...bucket,
        descriptionMarkdown: bucket.descriptionPath
          ? await loadMarkdown(bucket.descriptionPath, 'focusAreas')
          : undefined,
        inlineGuidanceMarkdown: bucket.inlineGuidancePath
          ? await loadMarkdown(bucket.inlineGuidancePath, 'focusAreas')
          : undefined,
      });

      const [quickTaste, deeperDive, handsOn, jobBoard] = await Promise.all([
        mapBucket(focusArea.buckets.quickTaste),
        mapBucket(focusArea.buckets.deeperDive),
        mapBucket(focusArea.buckets.handsOn),
        mapBucket(focusArea.buckets.jobBoard),
      ]);

      return {
        ...focusArea,
        overview,
        overviewPlainText,
        buckets: {
          quickTaste,
          deeperDive,
          handsOn,
          jobBoard,
        },
      };
    })
  );
}

export function getCommonPathways(): Promise<CommonPathway[]> {
  return loadContentFile('pathways');
}

export async function getFlowSteps(): Promise<FlowStep[]> {
  const steps = await loadContentFile<FlowStepManifest[]>('flow');

  return Promise.all(
    steps.map(async step => {
      const content = await loadMarkdown(step.contentPath, 'flow');
      return {
        ...step,
        content,
        contentPlainText: markdownToPlainText(content),
      };
    })
  );
}

export async function getTemplates(): Promise<Template[]> {
  const templates = await loadContentFile<TemplateManifest[]>('templates');

  return Promise.all(
    templates.map(async template => ({
      ...template,
      content: await loadMarkdown(template.contentPath, 'templates'),
    }))
  );
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
