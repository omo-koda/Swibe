export const PRICE_IDS = { PRO_MONTHLY: 'price_pro_monthly', PRO_YEARLY: 'price_pro_yearly', ENTERPRISE: 'price_enterprise' } as const
export const stripePromise = null
export const createCheckoutSession = async (priceId: string, email?: string) => { alert('Stripe not configured: ' + priceId); return { sessionId: 'stub_' + Date.now() } }
export const verifySession = async (sessionId: string) => ({ tier: 'pro', status: 'active' })
export const openCustomerPortal = async () => alert('Portal not configured')
export const getSubscriptionStatus = async () => ({ tier: localStorage.getItem('tier') || 'free', status: 'active' })
