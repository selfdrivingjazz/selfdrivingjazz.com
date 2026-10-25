'use client';

import type { AnchorHTMLAttributes } from 'react';
import { type AnalyticsEvent, trackEvent } from '../lib/analytics';

type TrackedAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick'> & {
  event: AnalyticsEvent;
};

/** A plain link for server components that records one named analytics event on click. */
export default function TrackedAnchor({ event, ...props }: TrackedAnchorProps) {
  return <a {...props} onClick={() => trackEvent(event)} />;
}
