import React, { useState } from 'react';
import { Shield, Phone, User, Heart, ArrowRight } from 'lucide-react';
import { NOKContact } from '../types';

export default function Onboarding({ onComplete }: { onComplete: (nok: NOKContact) => void }) {
  const [step, setStep] = useState(1);
  const [nok, setNok] = useState<NOKContact>({ name: '', phone: '', relation: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nok.name && nok.phone) {
      onComplete(nok);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 max-w-md mx-auto">
      <div className="w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20">
            <Shield className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">GUARDIAN PULSE</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Your behavioral safety net. We learn your daily rhythms to keep you safe when you're alone.
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <FeatureItem 
                icon={<Heart className="w-5 h-5 text-rose-500" />}
                title="Pattern Learning"
                desc="We learn when you usually wake up, bathe, and sleep."
              />
              <FeatureItem 
                icon={<Shield className="w-5 h-5 text-emerald-500" />}
                title="Privacy First"
                desc="All sensor data is processed locally on your device."
              />
              <FeatureItem 
                icon={<Phone className="w-5 h-5 text-blue-500" />}
                title="NOK Alerts"
                desc="Automated alerts to your loved ones if something's wrong."
              />
            </div>
            <button 
              onClick={() => setStep(2)}
              className="w-full py-4 bg-zinc-100 text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-95"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Emergency Contact</h2>
              <p className="text-zinc-500 text-sm">Who should we alert if we detect an anomaly?</p>
            </div>

            <div className="space-y-4">
              <InputGroup 
                icon={<User className="w-5 h-5" />}
                placeholder="Full Name"
                value={nok.name}
                onChange={(v) => setNok({ ...nok, name: v })}
              />
              <InputGroup 
                icon={<Phone className="w-5 h-5" />}
                placeholder="Phone Number"
                value={nok.phone}
                onChange={(v) => setNok({ ...nok, phone: v })}
              />
              <InputGroup 
                icon={<Heart className="w-5 h-5" />}
                placeholder="Relation (e.g. Daughter)"
                value={nok.relation}
                onChange={(v) => setNok({ ...nok, relation: v })}
              />
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-emerald-500 text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all active:scale-95"
            >
              Enable Protection
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
      <div className="mt-1">{icon}</div>
      <div>
        <p className="font-bold text-zinc-100">{title}</p>
        <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function InputGroup({ icon, placeholder, value, onChange }: { 
  icon: React.ReactNode; 
  placeholder: string; 
  value: string; 
  onChange: (v: string) => void 
}) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
        {icon}
      </div>
      <input 
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
      />
    </div>
  );
}
