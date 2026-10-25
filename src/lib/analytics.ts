import type { OpenPanel, TrackHandlerPayload } from '@openpanel/web';

/**
 * Production-only OpenPanel analytics (see AGENTS.md "Analytics").
 *
 * Collection requires all of: NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT=production, a
 * valid public NEXT_PUBLIC_OPENPANEL_CLIENT_ID, the canonical HTTPS host, and no
 * Do Not Track / Global Privacy Control signal. Otherwise the SDK is never
 * downloaded and nothing is sent. Release candidates copy `.env.local`, so the
 * host check is what keeps the tailnet preview silent. Only sanitized page
 * paths, the external referrer origin, and the named events below are sent.
 */

/** The served production host; the apex redirects here. */
const CANONICAL_HOST = 'www.selfdrivingjazz.com';
/** Hosts whose referrers count as internal navigation. */
const SITE_HOSTS: ReadonlySet<string> = new Set(['selfdrivingjazz.com', CANONICAL_HOST]);
const DEFAULT_API_URL = 'https://api.openpanel.dev';
const CLIENT_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_PATH_LENGTH = 200;

export type ContactChannel = 'github' | 'x' | 'substack';
export type ProjectOpenSource = 'crate' | 'index';

export type AnalyticsEvent =
  | { name: 'project_open'; project: string; source: ProjectOpenSource }
  | { name: 'project_link_open'; project: string }
  | { name: 'contact_open'; channel: ContactChannel };

const ALLOWED_EVENT_NAMES: ReadonlySet<string> = new Set<AnalyticsEvent['name'] | 'screen_view'>([
  'screen_view',
  'project_open',
  'project_link_open',
  'contact_open',
]);

interface AnalyticsConfig {
  clientId: string;
  apiUrl: string;
}

function parseApiUrl(value: string | undefined): string | null {
  try {
    const url = new URL(value?.trim() || DEFAULT_API_URL);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
    return url.origin + url.pathname.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

/** Build-time public configuration; NEXT_PUBLIC_* values are inlined by Next. */
function readConfig(): AnalyticsConfig | null {
  if (process.env.NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT !== 'production') return null;
  const clientId = process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID?.trim() ?? '';
  if (!CLIENT_ID_PATTERN.test(clientId)) return null;
  const apiUrl = parseApiUrl(process.env.NEXT_PUBLIC_OPENPANEL_API_URL);
  return apiUrl ? { clientId, apiUrl } : null;
}

function onCanonicalHost(): boolean {
  return window.location.protocol === 'https:' && window.location.hostname === CANONICAL_HOST;
}

function visitorAllowsTracking(): boolean {
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean };
  return privacy.globalPrivacyControl !== true && navigator.doNotTrack !== '1';
}

/** Only the origin of an external referrer; internal or unparsable ones become empty. */
function externalReferrerOrigin(): string {
  try {
    const referrer = new URL(document.referrer);
    if ((referrer.protocol === 'https:' || referrer.protocol === 'http:') && !SITE_HOSTS.has(referrer.hostname)) {
      return referrer.origin;
    }
  } catch {}
  return '';
}

function allowPayload(payload: TrackHandlerPayload): boolean {
  return payload.type === 'track' && ALLOWED_EVENT_NAMES.has(payload.payload.name);
}

async function startClient(): Promise<OpenPanel | null> {
  const config = readConfig();
  if (!config || !onCanonicalHost() || !visitorAllowsTracking()) return null;
  const { OpenPanel } = await import('@openpanel/web');
  const client = new OpenPanel({
    clientId: config.clientId,
    apiUrl: config.apiUrl,
    trackScreenViews: false,
    trackOutgoingLinks: false,
    trackAttributes: false,
    trackHashChanges: false,
    sessionReplay: { enabled: false },
    filter: allowPayload,
  });
  // The SDK records the full document.referrer; keep only an external origin.
  client.setGlobalProperties({ __referrer: externalReferrerOrigin() });
  return client;
}

let clientPromise: Promise<OpenPanel | null> | undefined;

function getClient(): Promise<OpenPanel | null> {
  clientPromise ??= startClient().catch(() => null);
  return clientPromise;
}

/** Records a page view of origin + path; query strings and fragments are never sent. */
export function trackPageView(pathname: string): void {
  void getClient()
    .then((client) => {
      client?.screenView(window.location.origin + pathname.slice(0, MAX_PATH_LENGTH));
    })
    .catch(() => undefined);
}

function eventProperties(event: AnalyticsEvent): Record<string, string> | null {
  switch (event.name) {
    case 'project_open':
      return SLUG_PATTERN.test(event.project) ? { project: event.project, source: event.source } : null;
    case 'project_link_open':
      return SLUG_PATTERN.test(event.project) ? { project: event.project } : null;
    case 'contact_open':
      return { channel: event.channel };
  }
}

/** Fire-and-forget; never delays or alters the action that triggered it. */
export function trackEvent(event: AnalyticsEvent): void {
  const properties = eventProperties(event);
  if (!properties) return;
  void getClient()
    .then((client) => {
      void client?.track(event.name, properties);
    })
    .catch(() => undefined);
}
