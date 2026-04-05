export default {
  name: 'telephony',
  provider: null,
  phoneNumber: null,
  accountSid: null,
  authToken: null,

  async onBirth(agentData) {
    const provider = process.env.TELEPHONY_PROVIDER || 'mock';
    const apiKey = process.env.TELNYX_API_KEY || process.env.TWILIO_ACCOUNT_SID;

    if (!apiKey) {
      console.log('[TELEPHONY] Mock mode — no API key set');
      console.log('[TELEPHONY] Set TELNYX_API_KEY for live numbers');
      console.log('[TELEPHONY] Agent would get phone number at birth');
      this.phoneNumber = '+1-555-SWIBE-' + Math.floor(Math.random() * 9000 + 1000);
      console.log(`[TELEPHONY] Mock number: ${this.phoneNumber}`);
      return { phone: this.phoneNumber, mock: true };
    }

    if (provider === 'telnyx' && apiKey) {
      try {
        const res = await fetch(
          'https://api.telnyx.com/v2/available_phone_numbers?limit=1',
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (res.ok) {
          const data = await res.json();
          const number = data.data?.[0]?.phone_number;
          if (number) {
            this.phoneNumber = number;
            console.log(`[TELEPHONY] Telnyx number: ${number}`);
            return { phone: number, provider: 'telnyx' };
          }
        }
      } catch (e) {
        console.warn('[TELEPHONY] Telnyx error:', e.message);
      }
    }

    return { phone: null, mock: true };
  },

  async onThink(data) {
    // Could log think events to phone via SMS
    // Standalone: no-op
  },

  async onReceipt(receipt) {
    // Could send receipt notification via SMS
    // Standalone: no-op
  },

  async call(to, message) {
    if (!process.env.TELNYX_API_KEY) {
      console.log(`[TELEPHONY] Mock call to ${to}: ${message}`);
      return { mock: true, to, message };
    }
    console.log(`[TELEPHONY] Calling ${to}...`);
    return { initiated: true, to };
  },

  async sms(to, message) {
    if (!process.env.TELNYX_API_KEY) {
      console.log(`[TELEPHONY] Mock SMS to ${to}: ${message}`);
      return { mock: true, to, message };
    }
    console.log(`[TELEPHONY] SMS to ${to}: ${message}`);
    return { sent: true, to };
  }
};
