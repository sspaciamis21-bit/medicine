'use client';

import React from 'react';
import { BellRing, CheckCircle2, Clock, X, AlertCircle, Pill, User } from 'lucide-react';
import { alarmEngine } from '@/utils/audioAlarm';

interface AlarmModalProps {
  isOpen: boolean;
  medicine: any;
  onTake: (medId: string) => void;
  onSnooze: (minutes?: number) => void;
  onSkip: (medId: string) => void;
  onDismiss: () => void;
}

export default function AlarmModal({
  isOpen,
  medicine,
  onTake,
  onSnooze,
  onSkip,
  onDismiss,
}: AlarmModalProps) {
  if (!isOpen || !medicine) return null;

  const memberName = medicine.member?.name || medicine.memberName || 'Family Member';
  const memberRelation = medicine.member?.relationship ? ` (${medicine.member.relationship})` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white border-2 border-[#ef4f5f] rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-pulse-alarm">
        {/* Ringing Animation */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-[#ef4f5f] border-2 border-red-200 mx-auto animate-bounce">
          <BellRing className="w-10 h-10 animate-wiggle" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-black rounded-full uppercase tracking-wider mb-2">
            🔔 Medicine Alarm Reminder
          </span>
          <h2 className="text-2xl font-black text-[#1c2a38] tracking-tight flex items-center justify-center gap-2">
            <Pill className="w-6 h-6 text-[#10847e]" /> {medicine.name}
          </h2>
          {medicine.strength && (
            <p className="text-xs font-bold text-slate-500">{medicine.strength}</p>
          )}
        </div>

        {/* Detailed High-Contrast Notification Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
          {/* Member Name */}
          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#10847e]" /> Patient / Member:
            </span>
            <span className="font-extrabold text-[#1c2a38] text-sm">
              {memberName}{memberRelation}
            </span>
          </div>

          {/* Scheduled Time */}
          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" /> Scheduled Time:
            </span>
            <span className="font-black text-blue-700 text-sm bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              ⏰ {medicine.specificTime || 'Now'}
            </span>
          </div>

          {/* Dose & Meal Context */}
          <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-semibold">Dose to Take:</span>
            <span className="font-bold text-[#10847e]">
              {medicine.doseAmount || 1} {medicine.unit || 'Tablets'} {medicine.mealRelation ? `• ${medicine.mealRelation}` : ''}
            </span>
          </div>

          {/* Stock remaining */}
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500 font-semibold">Current Stock:</span>
            <span className={`font-bold ${medicine.currentQuantity <= (medicine.lowStockThreshold || 5) ? 'text-amber-600 font-black' : 'text-slate-700'}`}>
              {medicine.currentQuantity} {medicine.unit || 'Units'} left
            </span>
          </div>

          {medicine.instructions && (
            <div className="pt-1.5 text-slate-600 border-t border-slate-200 text-[11px] leading-relaxed">
              <strong className="text-slate-800">Doctor&apos;s Note:</strong> {medicine.instructions}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => onTake(medicine.id)}
            className="w-full py-4 bg-[#10847e] hover:bg-[#0d6e69] text-white font-black text-base rounded-2xl shadow-lg shadow-[#10847e]/20 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            MARK AS TAKEN (Dose Done)
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onSnooze(10)}
              className="py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              Snooze 10 Mins
            </button>
            <button
              onClick={() => onSkip(medicine.id)}
              className="py-3 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
              Skip Dose
            </button>
          </div>

          <button
            onClick={onDismiss}
            className="w-full text-xs text-slate-400 hover:text-slate-600 py-1 cursor-pointer"
          >
            Stop Sound & Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
