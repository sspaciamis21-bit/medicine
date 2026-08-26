'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pill, KeyRound, User, Home, ArrowRight, ShieldCheck, HeartPulse, CheckCircle2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function AuthContent() {
  const router = useRouter();
  const { user, login, register, loading } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({
    username: '',
    password: '',
    householdName: '',
    adminName: '',
    email: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (mode === 'login') {
      const res = await login(form.username, form.password);
      setSubmitting(false);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } else {
      const res = await register({
        username: form.username,
        password: form.password,
        householdName: form.householdName || `${form.username}'s Family`,
        adminName: form.adminName || form.username,
        email: form.email,
      });
      setSubmitting(false);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setError(res.error || 'Registration failed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f1eb] flex flex-col justify-between text-[#1c2a38]">
      {/* Top Simple Header */}
      <header className="bg-white border-b border-[#e2e8f0] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#10847e] flex items-center justify-center text-white shadow-sm">
              <Pill className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#1c2a38]">
                Family Medicine <span className="text-[#10847e]">Organizer</span>
              </span>
              <span className="ml-2 px-2 py-0.5 bg-[#10847e]/10 text-[#10847e] text-[10px] font-bold rounded-md border border-[#10847e]/20">
                INDIA HEALTHCARE
              </span>
            </div>
          </div>
          <span className="text-xs text-[#6b7280] font-medium hidden sm:inline">
            Organize • Remind • Track Stock • Reorder
          </span>
        </div>
      </header>

      {/* Main Login / Register Area */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center flex-1">
        {/* Left Value Props (PharmEasy Style) */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#10847e]/10 text-[#10847e] rounded-full text-xs font-extrabold">
            <HeartPulse className="w-4 h-4" />
            Family Medicine & Health Organizer
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#1c2a38] leading-tight">
            Never Miss a Dose. <br />
            <span className="text-[#10847e]">Track Stocks & Refills</span> for Your Entire Family.
          </h1>

          <p className="text-sm text-[#4b5563] leading-relaxed">
            A comprehensive, multi-member medicine organizer for Indian households. Manage elderly parents' daily prescriptions, child syrups, insulin dosage logs, stock replenishment, and medical store contacts in one place.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Meal-linked reminders (Before/After Food, Breakfast, Lunch, Dinner)',
              'Loud audio alarm notifications with 10-minute snooze & skip logging',
              'Real-time stock countdown & automated low-stock warnings',
              'Dedicated insulin management module with 28-day opened-pen tracking',
              '1-Tap WhatsApp reorder dispatch & phone dialer to local pharmacies',
              'Weekly and monthly medicine expense tracking by family member',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-[#374151] font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#10847e] shrink-0 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Auth Card */}
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-7 shadow-lg border border-[#e2e8f0] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
            <div>
              <h2 className="text-xl font-black text-[#1c2a38]">
                {mode === 'login' ? 'Sign In to Family Portal' : 'Create Family Account'}
              </h2>
              <p className="text-xs text-[#6b7280] mt-0.5">
                {mode === 'login' ? 'Access your family medicine records' : 'Set up your family medicine tracker'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#10847e]/10 text-[#10847e] flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#f4f1eb] rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 rounded-lg transition ${
                mode === 'login'
                  ? 'bg-white text-[#10847e] shadow-xs'
                  : 'text-[#6b7280] hover:text-[#1c2a38]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 rounded-lg transition ${
                mode === 'register'
                  ? 'bg-white text-[#10847e] shadow-xs'
                  : 'text-[#6b7280] hover:text-[#1c2a38]'
              }`}
            >
              Register Family
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === 'register' && (
              <>
                <div>
                  <label className="font-bold text-[#374151] block mb-1">Household / Family Name *</label>
                  <div className="relative">
                    <Home className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="Enter family / household name"
                      value={form.householdName}
                      onChange={(e) => setForm({ ...form, householdName: e.target.value })}
                      className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-[#1c2a38] font-medium focus:border-[#10847e] outline-hidden text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#374151] block mb-1">Your Full Name (Admin Member) *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
                      value={form.adminName}
                      onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                      className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-[#1c2a38] font-medium focus:border-[#10847e] outline-hidden text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="font-bold text-[#374151] block mb-1">Username *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-[#1c2a38] font-medium focus:border-[#10847e] outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#374151] block mb-1">Password *</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-[#1c2a38] font-medium focus:border-[#10847e] outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#10847e] hover:bg-[#0d6e69] text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Please wait...' : mode === 'login' ? 'Sign In to Dashboard' : 'Create Family Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="bg-white border-t border-[#e2e8f0] py-4 text-center text-xs text-[#6b7280]">
        Family Medicine Management & Reminder System
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return <AuthContent />;
}
