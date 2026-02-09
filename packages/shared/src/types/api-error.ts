export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  statusCode: 400;
  message: string;
  error: 'Validation Error';
  fields: Record<string, string[]>;
}
