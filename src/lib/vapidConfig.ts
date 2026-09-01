// Client-safe VAPID Public Key configuration
// This file does NOT import any Node.js native modules and is 100% browser-safe

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BM-wZkwzPkTzlMugJiFa3rK8FJuSe00-hfd3eW3I4vcpYKhVOq_Ephy5OaM2nL8BQ8jWnaqznr1O-_R3xyr9AW0';
