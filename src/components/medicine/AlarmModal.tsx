'use client';

import React from 'react';
import { BellRing, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white border-2 border-[#ef4f5f] rounded-3xl p-6 shadow-2xl text-center animate-pulse-alarm">
        {/* Ringing Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-[#ef4f5f] border border-red-200 mb-3 mx-auto animate-bounce">
          <BellRing className="w-10 h-10" />
        </div>

        <div className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-black rounded-full uppercase tracking-wider mb-2">
          🔊 Medicine Alarm Reminder
        </div>

        <h2 className="text-2xl font-black text-[#1c2a38] tracking-tight">
          {medicine.name}
        </h2>
        <p className="text-[#10847e] font-bold text-sm mt-0.5">
          For {medicine.member?.name || medicine.memberName || 'Family Member'} • Dose: {medicine.doseAmount || 1} {medicine.unit || 'Tablets'}
        </p>

        {/* Schedule & stock info card */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Meal Timing:</span>
            <span className="font-bold text-[#10847e]">
              {medicine.mealRelation || 'After Food'} ({medicine.mealType || 'Meal'})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Current Stock:</span>
            <span className={`font-bold ${medicine.currentQuantity <= (medicine.lowStockThreshold || 5) ? 'text-amber-600' : 'text-slate-800'}`}>
              {medicine.currentQuantity} {medicine.unit || 'Units'} remaining
            </span>
          </div>
          {medicine.instructions && (
            <div className="pt-1 text-slate-600 border-t border-slate-200">
              <strong className="text-slate-700">Doctor's Instructions:</strong> {medicine.instructions}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-2.5">
          <button
            onClick={() => onTake(medicine.id)}
            className="w-full py-4 bg-[#10847e] hover:bg-[#0d6e69] text-white font-black text-base rounded-2xl shadow-lg shadow-[#10847e]/20 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5" />
            MARK AS TAKEN (Dose Done)
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onSnooze(10)}
              className="py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Clock className="w-4 h-4" />
              Snooze 10 Mins
            </button>
            <button
              onClick={() => onSkip(medicine.id)}
              className="py-3 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <X className="w-4 h-4" />
              Skip Dose
            </button>
          </div>

          <button
            onClick={onDismiss}
            className="w-full text-xs text-slate-500 hover:text-slate-700 py-1"
          >
            Stop Sound & Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
