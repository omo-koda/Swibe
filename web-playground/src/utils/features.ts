export const FEATURES = { BATCH_GEN: 'batch_gen', API_ACCESS: 'api_access', POISON_RADAR: 'poison_radar', MULTI_CHAIN: 'multi_chain' } as const
export const TIER_LABELS: Record<string, string> = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' }
export const getCurrentTier = () => localStorage.getItem('tier') || 'free'
export const setTier = (tier: string) => localStorage.setItem('tier', tier)
export const hasFeature = (feature: string) => { const t = getCurrentTier(); return t === 'enterprise' || (t === 'pro' && feature !== 'api_access') || ['poison_radar', 'multi_chain'].includes(feature) }
export const getLimit = (type: 'workers' | 'results' | 'batch_size') => ({ free: { workers: 4, results: 10, batch_size: 1 }, pro: { workers: 16, results: 100, batch_size: 10 }, enterprise: { workers: 64, results: 1000, batch_size: 100 } }[getCurrentTier()]?.[type] || 4)

export const TIER_PRICES: Record<string, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 9.99, yearly: 99 },
  enterprise: { monthly: 99, yearly: 999 },
}
