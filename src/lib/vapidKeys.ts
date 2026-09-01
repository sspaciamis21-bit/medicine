// Server-Only Web Push & VAPID Configuration
// Uses Node.js native crypto and web-push for dispatching notifications

import webpush from 'web-push';
import { VAPID_PUBLIC_KEY } from './vapidConfig';

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'MvW1UirfbOKULu8sgXuYVf32e1V95oOiWSQiv11Vg50';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:support@familymedicine.local';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.warn('VAPID setup warning:', e);
}

export { VAPID_PUBLIC_KEY };
export default webpush;
