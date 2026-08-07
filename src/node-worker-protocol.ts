import type { ConversionOptions, FilterOptions } from './types.js';

/** Conversion fields shared by the Node worker-thread and subprocess protocols. */
export interface NodeWorkerConversionPayload {
  inputFormat: string;
  outputFormat: string;
  filterOptions?: FilterOptions;
  password?: string;
}

/** Result envelope shared by Node workers and their owners. */
export interface NodeWorkerOperationResponse {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
  quarantine?: boolean;
}

interface NodeRuntimeState {
  isReady(): boolean;
}

/** Build one ConversionOptions object at the worker boundary. */
export function createNodeWorkerConversionOptions(
  payload: NodeWorkerConversionPayload
): ConversionOptions {
  return {
    inputFormat: payload.inputFormat as NonNullable<ConversionOptions['inputFormat']>,
    outputFormat: payload.outputFormat as ConversionOptions['outputFormat'],
    ...(payload.filterOptions === undefined
      ? {}
      : { filterOptions: payload.filterOptions }),
    ...(payload.password === undefined ? {} : { password: payload.password }),
  };
}

export function normalizeNodeWorkerError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  try {
    return String(error);
  } catch {
    return 'Unknown worker error';
  }
}

export function shouldQuarantineNodeRuntime(
  runtime: NodeRuntimeState | null
): boolean {
  return runtime !== null && !runtime.isReady();
}

/**
 * Create a structured failure response. Only conversion can poison a runtime;
 * initialization and pointer-based editor/render operations keep their existing
 * lifecycle behavior.
 */
export function createNodeWorkerFailureResponse(
  id: string,
  operation: string,
  error: unknown,
  runtime: NodeRuntimeState | null
): NodeWorkerOperationResponse {
  const quarantine = operation === 'convert' && shouldQuarantineNodeRuntime(runtime);

  return {
    id,
    success: false,
    error: normalizeNodeWorkerError(error),
    ...(quarantine ? { quarantine: true } : {}),
  };
}
