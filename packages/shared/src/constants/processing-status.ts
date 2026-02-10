export const ProcessingStatus = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  FAILED: 'failed',
} as const);

export type ProcessingStatus = (typeof ProcessingStatus)[keyof typeof ProcessingStatus];
