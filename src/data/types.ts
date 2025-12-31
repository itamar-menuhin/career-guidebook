// Content Data Types for Career Counseling Guidebook

export type CommitmentLevel = 'low' | 'medium' | 'high';
export type CardType = 'quick-taste' | 'deeper-dive' | 'hands-on' | 'job-board';
export type TopicTag = 'org-list' | 'reading' | 'program' | 'project' | 'course' | 'community' | 'job-board' | 'research' | 'tool' | 'person';

export interface RecommendationCard {
  id: string;
  title: string;
  oneLiner: string;
  whenToSuggest: string;
  whenNotToSuggest: string;
  tags: {
    topic: TopicTag;
    type: CardType;
    commitment: CommitmentLevel;
    goodFitIf: string[];
  };
  firstSmallStep: string;
  nextStep: string;
  links: { label: string; url: string }[];
  peopleToTalkTo?: string[];
  internalNotes?: string;
  focusAreaIds?: string[];
}

export interface FocusAreaBucket {
  title: string;
  description: string;
  cardIds: string[];
  inlineGuidance?: string;
}

export interface FocusArea {
  id: string;
  name: string;
  overview: string;
  roleShapes: string[];
  fitSignals: string[];
  buckets: {
    quickTaste: FocusAreaBucket;
    deeperDive: FocusAreaBucket;
    handsOn: FocusAreaBucket;
    jobBoard: FocusAreaBucket;
  };
  curatedCardIds: string[];
  peopleToTalkToPrompts: string[];
  commonConfusions?: string[];
}

export interface CommonPathway {
  id: string;
  name: string;
  description: string;
  whenToSuggest: string;
  fitTestPrompts: string[];
  defaultFirstSmallStep: string;
  relatedCardIds?: string[];
}

export interface SessionStep {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  prompts: string[];
  color: string;
}
