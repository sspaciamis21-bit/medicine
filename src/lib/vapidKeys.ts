// VAPID Cryptographic Keys for Server-Side Web Push Notifications
// These allow the server to securely push notifications to Google (Chrome/Android), Mozilla (Firefox), and Apple (Safari/iOS)

import webpush from 'web-push';

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BM-wZkwzPkTzlMugJiFa3rK8FJuSe00-hfd3eW3I4vcpYKhVOq_Ephy5OaM2nL8BQ8jWnaqznr1O-_R3xyr9AW0';

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'MvW1UirfbOKULu8sgXuYVf32e1V95oOiWSQiv11Vg50';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:support@familymedicine.local';

// Configure web-push details
try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.warn('VAPID setup warning:', e);
}

export default webpush;
