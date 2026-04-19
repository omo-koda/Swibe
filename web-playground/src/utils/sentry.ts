/**
 * Sentry stub — removed from core bundle per security audit.
 * If error tracking is needed, load dynamically behind a feature flag.
 */
export const initSentry = () => {}
export const captureError = (_error: unknown, _context?: unknown) => {}
export const captureMessage = (_message: string, _level?: string) => {}
