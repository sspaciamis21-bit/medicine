'use client';

import React, { useState, useEffect } from 'react';
import { History, Calendar, Check, X, Clock, AlertCircle, Filter, Search } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';

export default function HistoryPage() {
  const { user, selectedMember } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [histRes, memRes, medRes] = await Promise.all([
        fetch(`/api/dose-history${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
        fetch(`/api/members${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
        fetch(`/api/medicines${user?.householdId ? `?householdId=${user.householdId}` : ''}`),
      ]);

      const histData = await histRes.json();
      const memData = await memRes.json();
      const medData = await medRes.json();

      if (histData.success) setHistory(histData.history || []);
      if (memData.success) setMembers(memData.members || []);
      if (medData.success) setMedicines(medData.medicines || []);
    } catch (e) {
      console.error('Error loading history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Filter history records
  const filteredHistory = history.filter((item) => {
    if (selectedMember !== 'all' && item.memberId !== selectedMember) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const medMatch = item.medicine?.name?.toLowerCase().includes(q);
      const memMatch = item.member?.name?.toLowerCase().includes(q);
      if (!medMatch && !memMatch) return false;
    }
    return true;
  });

  const totalDoses = history.length;
  const takenDoses = history.filter((h) => h.status === 'taken').length;
  const skippedDoses = history.filter((h) => h.status === 'skipped').length;
  const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-[#e2e8f0]">
          <div>
            <h1 className="text-xl font-black text-[#1c2a38] flex items-center gap-2">
              <History className="w-5 h-5 text-[#10847e]" /> Medicine Adherence History Log
            </h1>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Comprehensive audit trail of taken, skipped, and snoozed doses across family members (Spec §16)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 bg-[#10847e]/10 text-[#10847e] rounded-xl border border-[#10847e]/20 text-xs font-black">
              Overall Adherence: {adherenceRate}%
            </div>
          </div>
        </div>

        {/* Adherence Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="medical-card p-4 bg-white">
            <span className="text-xs text-[#6b7280] font-semibold">Total Logged</span>
            <p className="text-2xl font-black text-[#1c2a38] mt-1">{totalDoses}</p>
            <span className="text-[11px] text-slate-500">All recorded doses</span>
          </div>

          <div className="medical-card p-4 bg-white">
            <span className="text-xs text-[#10847e] font-semibold">Taken on Time</span>
            <p className="text-2xl font-black text-[#10847e] mt-1">{takenDoses}</p>
            <span className="text-[11px] text-[#10847e] font-bold">{adherenceRate}% adherence rate</span>
          </div>

          <div className="medical-card p-4 bg-white">
            <span className="text-xs text-rose-600 font-semibold">Skipped Doses</span>
            <p className="text-2xl font-black text-rose-600 mt-1">{skippedDoses}</p>
            <span className="text-[11px] text-rose-600">Missed/Skipped</span>
          </div>

          <div className="medical-card p-4 bg-white">
            <span className="text-xs text-amber-600 font-semibold">Snoozed Alerts</span>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {history.filter((h) => h.status === 'snoozed').length}
            </p>
            <span className="text-[11px] text-amber-600">Postponed doses</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="medical-card p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by medicine or member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#fbf9f5] border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:border-[#10847e] outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs font-bold text-[#6b7280] shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            {['all', 'taken', 'skipped', 'snoozed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition shrink-0 ${
                  statusFilter === st
                    ? 'bg-[#10847e] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* History Table */}
        <div className="medical-card bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-[#1c2a38] text-sm">Adherence Audit Log ({filteredHistory.length} records)</h3>
            <span className="text-xs text-[#6b7280]">Latest on top</span>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <History className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-[#1c2a38] text-sm">No History Records Found</h4>
              <p className="text-xs text-[#6b7280] max-w-sm mx-auto">
                Whenever you mark medicines as Taken, Skipped, or Snoozed in reminders or dashboard, an audit record will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-left text-[#6b7280] border-b border-slate-100">
                    <th className="px-4 py-3 font-bold">Date & Time</th>
                    <th className="px-4 py-3 font-bold">Medicine</th>
                    <th className="px-4 py-3 font-bold">Family Member</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Action Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((item) => {
                    const isTaken = item.status === 'taken';
                    const isSkipped = item.status === 'skipped';
                    const isSnoozed = item.status === 'snoozed';
                    const recordDate = new Date(item.scheduledDateTime || item.createdAt);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                          {recordDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                          <span className="text-slate-400 font-normal">
                            {recordDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-[#1c2a38]">
                          {item.medicine?.name || 'Medicine'}
                          {item.medicine?.strength && (
                            <span className="text-slate-500 font-normal ml-1">({item.medicine.strength})</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 font-semibold text-[#1c2a38]">
                            <span>{item.member?.avatar || '👤'}</span>
                            <span>{item.member?.name || 'Member'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isTaken && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#10847e]/10 text-[#10847e] font-extrabold text-[11px] border border-[#10847e]/30">
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> TAKEN
                            </span>
                          )}
                          {isSkipped && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[11px]">
                              <X className="w-3.5 h-3.5 stroke-[2.5]" /> SKIPPED
                            </span>
                          )}
                          {isSnoozed && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[11px]">
                              <Clock className="w-3.5 h-3.5" /> SNOOZED
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {isTaken ? 'Stock decremented automatically' : isSkipped ? 'Skipped with stock preserved' : 'Alarm postponed'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
