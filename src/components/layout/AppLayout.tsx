'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Pill, 
  Clock, 
  Syringe, 
  Package, 
  Phone, 
  DollarSign, 
  History, 
  Sliders 
} from 'lucide-react';
import AppHeader from './AppHeader';
import InstallPrompt from '../pwa/InstallPrompt';
import GlobalReminderDaemon from '../medicine/GlobalReminderDaemon';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const mobileNav = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/medicines', label: 'Medicines', icon: Pill },
    { href: '/reminders', label: 'Schedule', icon: Clock },
    { href: '/insulin', label: 'Insulin', icon: Syringe },
    { href: '/stock', label: 'Stock', icon: Package },
    { href: '/pharmacy', label: 'Reorder', icon: Phone },
    { href: '/expenses', label: 'Expense', icon: DollarSign },
    { href: '/history', label: 'Log', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#f4f1eb] flex flex-col justify-between text-[#1c2a38]">
      <InstallPrompt />
      <GlobalReminderDaemon />
      <AppHeader />
      
      <main className="max-w-7xl w-full mx-auto px-3.5 sm:px-6 py-5 flex-1 pb-24 lg:pb-10">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e2e8f0] px-2 py-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] lg:hidden">
        <div className="flex items-center justify-around overflow-x-auto hide-scrollbar">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition shrink-0 ${
                  isActive
                    ? 'text-[#10847e] font-extrabold'
                    : 'text-[#6b7280] hover:text-[#1c2a38]'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
