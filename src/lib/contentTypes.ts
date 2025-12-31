import { z } from 'zod';

export const commitmentLevels = ['low', 'medium', 'high'] as const;
export const cardTypes = ['quick-taste', 'deeper-dive', 'hands-on', 'job-board'] as const;
export const topicTags = [
  'org-list',
  'reading',
  'program',
  'project',
  'course',
  'community',
  'job-board',
  'research',
  'tool',
  'person',
] as const;

const LinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const RecommendationCardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  oneLiner: z.string().min(1),
  whenToSuggest: z.string().min(1),
  whenNotToSuggest: z.string().min(1),
  tags: z.object({
    topic: z.enum(topicTags),
    type: z.enum(cardTypes),
    commitment: z.enum(commitmentLevels),
    goodFitIf: z.array(z.string().min(1)),
  }),
  firstSmallStep: z.string().min(1),
  nextStep: z.string().min(1),
  links: z.array(LinkSchema).default([]),
  peopleToTalkTo: z.array(z.string().min(1)).optional().default([]),
  internalNotes: z.string().optional(),
  focusAreaIds: z.array(z.string().min(1)).optional().default([]),
});

const FocusAreaBucketSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  descriptionPath: z.string().optional(),
  cardIds: z.array(z.string().min(1)).default([]),
  inlineGuidance: z.string().optional(),
  inlineGuidancePath: z.string().optional(),
});

export const FocusAreaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  overviewPath: z.string().min(1),
  overviewExcerpt: z.string().optional(),
  roleShapes: z.array(z.string().min(1)),
  fitSignals: z.array(z.string().min(1)),
  buckets: z.object({
    quickTaste: FocusAreaBucketSchema,
    deeperDive: FocusAreaBucketSchema,
    handsOn: FocusAreaBucketSchema,
    jobBoard: FocusAreaBucketSchema,
  }),
  curatedCardIds: z.array(z.string().min(1)).default([]),
  peopleToTalkToPrompts: z.array(z.string().min(1)).default([]),
  commonConfusions: z.array(z.string().min(1)).optional(),
});

export const CommonPathwaySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  whenToSuggest: z.string().min(1),
  fitTestPrompts: z.array(z.string().min(1)),
  defaultFirstSmallStep: z.string().min(1),
  relatedCardIds: z.array(z.string().min(1)).optional().default([]),
});

export const FlowStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  shortTitle: z.string().min(1),
  summary: z.string().optional(),
  color: z.string().min(1),
  contentPath: z.string().min(1),
  order: z.number().optional(),
});

export const TemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['wrap', 'focus-area', 'tool', 'other']).default('other'),
  locked: z.boolean().optional().default(false),
  contentPath: z.string().min(1),
});

export type RecommendationCard = z.infer<typeof RecommendationCardSchema>;
export type FocusAreaBucket = z.infer<typeof FocusAreaBucketSchema>;
export type FocusAreaBucketWithContent = FocusAreaBucket & {
  descriptionMarkdown?: string;
  inlineGuidanceMarkdown?: string;
};
export type FocusAreaManifest = z.infer<typeof FocusAreaSchema>;
export type FocusArea = FocusAreaManifest & {
  overview: string;
  overviewPlainText: string;
  buckets: {
    quickTaste: FocusAreaBucketWithContent;
    deeperDive: FocusAreaBucketWithContent;
    handsOn: FocusAreaBucketWithContent;
    jobBoard: FocusAreaBucketWithContent;
  };
};
export type CommonPathway = z.infer<typeof CommonPathwaySchema>;
export type FlowStepManifest = z.infer<typeof FlowStepSchema>;
export type FlowStep = FlowStepManifest & {
  content: string;
  contentPlainText: string;
};
export type TemplateManifest = z.infer<typeof TemplateSchema>;
export type Template = TemplateManifest & {
  content: string;
};
