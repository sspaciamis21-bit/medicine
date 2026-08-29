'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Pill, 
  Clock, 
  Syringe, 
  Phone, 
  DollarSign, 
  History, 
  Sliders, 
  Package, 
  Users, 
  BellRing, 
  LogOut, 
  LayoutDashboard,
  Volume2,
  VolumeX,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { alarmEngine } from '@/utils/audioAlarm';

interface FamilyMemberItem {
  id: string;
  name: string;
  relationship: string;
  avatar: string;
  color?: string;
}

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, selectedMember, setSelectedMember } = useAuth();
  
  const [members, setMembers] = useState<FamilyMemberItem[]>([]);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Check if current user is a test admin user
  const isTestUser = user?.username?.toLowerCase().includes('test') || user?.username?.toLowerCase() === 'admin';

  useEffect(() => {
    if (user?.householdId) {
      fetch(`/api/members?householdId=${user.householdId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.members) {
            setMembers(data.members);
          }
        })
        .catch((e) => console.error(e));
    }
  }, [user]);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/medicines', label: 'Medicines', icon: Pill },
    { href: '/reminders', label: 'Reminders', icon: Clock },
    { href: '/insulin', label: 'Insulin', icon: Syringe },
    { href: '/stock', label: 'Stock & Alerts', icon: Package },
    { href: '/pharmacy', label: 'Pharmacies', icon: Phone },
    { href: '/expenses', label: 'Expenses', icon: DollarSign },
    { href: '/history', label: 'History', icon: History },
    { href: '/family', label: 'Family', icon: Users },
    { href: '/settings', label: 'Settings', icon: Sliders },
  ];

  const handleTestAlarm = () => {
    if (alarmEngine && audioEnabled) {
      alarmEngine.playMedicalChimeSequence();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e2e8f0] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#10847e] flex items-center justify-center text-white shadow-sm group-hover:bg-[#0d6e69] transition">
              <Pill className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#1c2a38]">
                  {user?.householdName || 'Family Medicine Management'}
                </span>
                <span className="px-2 py-0.5 bg-[#10847e]/10 text-[#10847e] text-[10px] font-bold rounded-md border border-[#10847e]/20 hidden sm:inline">
                  PORTAL
                </span>
              </div>
              <p className="text-[11px] text-[#6b7280] font-medium leading-none mt-0.5 hidden sm:block">
                Medicine & Health Organizer
              </p>
            </div>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Test User Audio Chime Badge (Only displayed for test user / admin) */}
          {isTestUser && (
            <>
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-1.5 sm:p-2 rounded-xl border transition text-xs font-semibold flex items-center gap-1.5 ${
                  audioEnabled
                    ? 'bg-[#10847e]/10 text-[#10847e] border-[#10847e]/30'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
                title="Audio Alarm Sound Toggle (Test Mode)"
              >
                {audioEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="hidden md:inline">{audioEnabled ? 'Alarm ON' : 'Muted'}</span>
              </button>

              <button
                onClick={handleTestAlarm}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#ef4f5f] hover:bg-[#dc3545] text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
                title="Test High-Volume Chime"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Test Alarm</span>
              </button>
            </>
          )}

          {/* User Account / Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-[#1c2a38] leading-tight">{user.username}</span>
                <span className="text-[10px] text-[#6b7280] capitalize">{user.role || 'Member'}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="p-2 text-slate-400 hover:text-[#ef4f5f] hover:bg-red-50 rounded-xl transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation Links Bar (Desktop Header) */}
      <div className="border-t border-[#f0ece1] bg-[#fbf9f5] px-4 sm:px-6 py-1.5 hidden lg:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-[#10847e] text-white shadow-xs'
                      : 'text-[#4b5563] hover:text-[#10847e] hover:bg-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Family Member Filter Pills */}
          {members.length > 0 && (
            <div className="flex items-center gap-1.5 pl-4 border-l border-slate-200 overflow-x-auto hide-scrollbar">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Filter:</span>
              <button
                onClick={() => setSelectedMember('all')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedMember === 'all'
                    ? 'bg-[#10847e] text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-[#10847e]'
                }`}
              >
                All ({members.length})
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    selectedMember === m.id
                      ? 'bg-[#10847e] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-[#10847e]'
                  }`}
                >
                  <span>{m.avatar || '👤'}</span>
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 space-y-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-[#10847e] text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Member Switcher Mobile */}
          {members.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 block mb-1.5">Filter Family Member:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    setSelectedMember('all');
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    selectedMember === 'all' ? 'bg-[#10847e] text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  All Members
                </button>
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMember(m.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                      selectedMember === m.id ? 'bg-[#10847e] text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>{m.avatar || '👤'}</span>
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
