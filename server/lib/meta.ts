import crypto from 'crypto';

const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_API_VERSION = 'v21.0';

interface EventData {
  event_name: string;
  event_time: number;
  event_source_url?: string;
  user_data: {
    client_ip_address?: string;
    client_user_agent?: string;
    external_id?: string;
    em?: string; // hashed email
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_name?: string;
    content_category?: string;
  };
  event_id?: string;
  action_source: 'website';
}

function hashData(data: string): string {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

function generateEventId(): string {
  return `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

async function sendEvent(eventData: EventData): Promise<boolean> {
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
    console.log('[Meta CAPI] Missing credentials, skipping event:', eventData.event_name);
    return false;
  }

  const url = `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events`;
  
  const payload = {
    data: [eventData],
    access_token: META_ACCESS_TOKEN,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`[Meta CAPI] Event '${eventData.event_name}' sent successfully:`, result);
      return true;
    } else {
      console.error(`[Meta CAPI] Failed to send event '${eventData.event_name}':`, result);
      return false;
    }
  } catch (error) {
    console.error(`[Meta CAPI] Error sending event '${eventData.event_name}':`, error);
    return false;
  }
}

export async function trackCompleteRegistration(params: {
  userId: number;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  sourceUrl?: string;
}): Promise<boolean> {
  const eventData: EventData = {
    event_name: 'CompleteRegistration',
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: params.sourceUrl || 'https://meinedokbox.de/register',
    user_data: {
      client_ip_address: params.ipAddress,
      client_user_agent: params.userAgent,
      external_id: hashData(params.userId.toString()),
      em: hashData(params.email),
    },
    custom_data: {
      content_name: 'User Registration',
    },
    event_id: generateEventId(),
    action_source: 'website',
  };

  return sendEvent(eventData);
}

export async function trackStartTrial(params: {
  userId: number;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  sourceUrl?: string;
}): Promise<boolean> {
  const eventData: EventData = {
    event_name: 'StartTrial',
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: params.sourceUrl || 'https://meinedokbox.de/register',
    user_data: {
      client_ip_address: params.ipAddress,
      client_user_agent: params.userAgent,
      external_id: hashData(params.userId.toString()),
      em: hashData(params.email),
    },
    custom_data: {
      content_name: '7-Day Trial',
    },
    event_id: generateEventId(),
    action_source: 'website',
  };

  return sendEvent(eventData);
}

export async function trackSubscribe(params: {
  userId: number;
  email: string;
  plan: string;
  value: number;
  currency?: string;
  ipAddress?: string;
  userAgent?: string;
  sourceUrl?: string;
}): Promise<boolean> {
  const eventData: EventData = {
    event_name: 'Subscribe',
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: params.sourceUrl || 'https://meinedokbox.de/pricing',
    user_data: {
      client_ip_address: params.ipAddress,
      client_user_agent: params.userAgent,
      external_id: hashData(params.userId.toString()),
      em: hashData(params.email),
    },
    custom_data: {
      currency: params.currency || 'EUR',
      value: params.value,
      content_name: params.plan,
      content_category: 'Subscription',
    },
    event_id: generateEventId(),
    action_source: 'website',
  };

  return sendEvent(eventData);
}
