export const AnalyticsEvents = {
  UPGRADE_CLICKED: 'upgrade_clicked',
  API_KEY_GENERATED: 'api_key_generated',
  GENERATION_STARTED: 'generation_started',
  GENERATION_COMPLETED: 'generation_completed',
  ADDRESS_FOUND: 'address_found',
  PAGE_VIEW: 'page_view',
  ERROR: 'error',
} as const

export const trackEvent = (event: string, data?: any) => console.debug(`[Analytics] ${event}`, data)
export const trackPageView = (page: string) => console.debug(`[Analytics] Page: ${page}`)
export const trackError = (error: Error, context?: any) => console.error('[Analytics]', error, context)
export const trackGenerationStarted = (data: any) => trackEvent('generation_started', data)
export const trackGenerationCompleted = (data: any) => trackEvent('generation_completed', data)
export const trackAddressFound = (data: any) => trackEvent('address_found', data)
export const trackUpgradeClicked = (data: any) => trackEvent('upgrade_clicked', data)
export const trackApiKeyGenerated = (data: any) => trackEvent('api_key_generated', data)
