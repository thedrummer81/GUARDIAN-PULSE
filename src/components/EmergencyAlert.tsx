import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldCheck, PhoneCall, MapPin, Clock } from 'lucide-react';
import { AppState, NOKContact } from '../types';

interface EmergencyAlertProps {
  state: AppState;
  onConfirm: () => void;
  nok: NOKContact;
}

export default function EmergencyAlert({ state, onConfirm, nok }: EmergencyAlertProps) {
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds

  useEffect(() => {
    if (state === 'monitoring' || state === 'nok_alerted') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCritical = timeLeft <= 900; // 15 minutes left

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-8 text-center ${
        isCritical ? 'bg-red-600' : 'bg-amber-500'
      }`}
    >
      <div className="relative z-10 w-full max-w-sm space-y-12">
        <div className="space-y-4">
          <div 
            className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md border-4 border-white/30"
          >
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter leading-none">
            SAFETY CHECK:<br />ARE YOU OK?
          </h2>
          <p className="text-white/80 font-medium text-lg">
            Abnormal inactivity detected.
          </p>
        </div>

        <div className="bg-black/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 space-y-2">
          <div className="flex items-center justify-center gap-2 text-white/60 uppercase tracking-widest text-xs font-bold">
            <Clock className="w-4 h-4" />
            NOK Alert In
          </div>
          <div className="text-6xl font-mono font-bold text-white tracking-tighter">
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={onConfirm}
            className="w-full py-6 bg-white text-black text-2xl font-black rounded-full shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-3"
          >
            <ShieldCheck className="w-8 h-8" />
            I AM OK
          </button>
          
          <button 
            className="w-full py-4 bg-black/30 text-white font-bold rounded-full backdrop-blur-md border border-white/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-5 h-5" />
            I NEED HELP NOW
          </button>
        </div>

        <div className="pt-8 space-y-2">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Emergency Contact</p>
          <div className="flex items-center justify-center gap-3 text-white">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold">{nok.name} ({nok.relation})</p>
              <p className="text-sm opacity-70">{nok.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* GPS Status */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 text-white/40 text-[10px] font-bold uppercase tracking-widest">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          GPS Active
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Recording Baseline
        </div>
      </div>
    </div>
  );
}
