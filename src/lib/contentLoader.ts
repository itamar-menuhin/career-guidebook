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

const markdownFiles = import.meta.glob('../../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const markdownMap = new Map<string, string>(
  Object.entries(markdownFiles).map(([path, content]) => {
    const normalized = path.replace(/\\/g, '/').replace(/^.*content\//, 'content/');
    return [normalized, content as string];
  })
);

const normalizeContentPath = (path: string) => {
  const cleaned = path.replace(/\\/g, '/').replace(/^\.\//, '');
  return cleaned.startsWith('content/') ? cleaned : `content/${cleaned}`;
};

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

function getMarkdownContent(contentPath: string, context: ContentKey) {
  const normalized = normalizeContentPath(contentPath);
  const content = markdownMap.get(normalized);

  if (!content) {
    throw new ContentLoadError(
      `Missing markdown content at path "${normalized}" for ${context}`,
      'missing-markdown',
      { path: normalized }
    );
  }

  return content;
}

export function clearContentCache() {
  cache.clear();
}

export function getRecommendationCards(): Promise<RecommendationCard[]> {
  return loadContentFile('cards');
}

export function getFocusAreas(): Promise<FocusArea[]> {
  return loadContentFile<FocusAreaManifest[]>('focusAreas').then(manifests =>
    manifests.map(focusArea => {
      const overview = getMarkdownContent(focusArea.overviewPath, 'focusAreas');
      const overviewPlainText = markdownToPlainText(overview);

      const mapBucket = (
        bucket: FocusAreaManifest['buckets'][keyof FocusAreaManifest['buckets']]
      ) => ({
        ...bucket,
        descriptionMarkdown: bucket.descriptionPath
          ? getMarkdownContent(bucket.descriptionPath, 'focusAreas')
          : undefined,
        inlineGuidanceMarkdown: bucket.inlineGuidancePath
          ? getMarkdownContent(bucket.inlineGuidancePath, 'focusAreas')
          : undefined,
      });

      return {
        ...focusArea,
        overview,
        overviewPlainText,
        buckets: {
          quickTaste: mapBucket(focusArea.buckets.quickTaste),
          deeperDive: mapBucket(focusArea.buckets.deeperDive),
          handsOn: mapBucket(focusArea.buckets.handsOn),
          jobBoard: mapBucket(focusArea.buckets.jobBoard),
        },
      };
    })
  );
}

export function getCommonPathways(): Promise<CommonPathway[]> {
  return loadContentFile('pathways');
}

export function getFlowSteps(): Promise<FlowStep[]> {
  return loadContentFile<FlowStepManifest[]>('flow').then(steps =>
    steps.map(step => {
      const content = getMarkdownContent(step.contentPath, 'flow');
      return {
        ...step,
        content,
        contentPlainText: markdownToPlainText(content),
      };
    })
  );
}

export function getTemplates(): Promise<Template[]> {
  return loadContentFile<TemplateManifest[]>('templates').then(templates =>
    templates.map(template => ({
      ...template,
      content: getMarkdownContent(template.contentPath, 'templates'),
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
