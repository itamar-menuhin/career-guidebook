export const buildFlowAnchor = (stepId: string) => `flow-${stepId}`;

export const parseFlowStepIdFromHash = (hashValue: string) => {
  const cleaned = decodeURIComponent(hashValue.replace('#', ''));
  return cleaned.replace(/^flow-/, '');
};

export const buildCardAnchor = (cardId: string) => `card-${cardId}`;

export const buildPathwayAnchor = (pathwayId: string) => `pathway-${pathwayId}`;

export const buildBucketAnchor = (bucketKey: string) => `bucket-${bucketKey}`;
