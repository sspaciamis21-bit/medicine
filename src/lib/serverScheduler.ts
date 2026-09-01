// In-Process Node.js Background Push Scheduler
// Runs every 60 seconds on the server to check for due doses and trigger Web Push

import { checkAndDispatchDueReminders } from './pushSender';

declare global {
  // eslint-disable-next-line no-var
  var __medifamily_scheduler_started: boolean | undefined;
}

export function initServerScheduler() {
  if (typeof window !== 'undefined') return;
  if (global.__medifamily_scheduler_started) return;

  global.__medifamily_scheduler_started = true;
  console.log('⏰ Server-Side Background Push Notification Scheduler Started');

  // Run initial check after 5 seconds
  setTimeout(async () => {
    try {
      await checkAndDispatchDueReminders();
    } catch (e) {}
  }, 5000);

  // Repeat every 60 seconds
  setInterval(async () => {
    try {
      await checkAndDispatchDueReminders();
    } catch (e) {
      console.warn('Push scheduler tick error:', e);
    }
  }, 60000);
}

// Auto-start on module load
initServerScheduler();
