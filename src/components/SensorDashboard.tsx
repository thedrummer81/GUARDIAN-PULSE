import React from 'react';
import { Battery, Sun, Smartphone, Activity } from 'lucide-react';
import { SensorData } from '../types';

export default function SensorDashboard({ data }: { data: SensorData }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Live Sensors</h2>
      <div className="grid grid-cols-2 gap-4">
        <SensorCard 
          icon={<Activity className="w-4 h-4" />} 
          label="Motion" 
          value={data.accelerometer ? 'Active' : 'Idle'} 
          subValue={data.accelerometer ? `${data.accelerometer.z.toFixed(2)}m/s²` : '0.00'}
          active={!!data.accelerometer}
        />
        <SensorCard 
          icon={<Battery className="w-4 h-4" />} 
          label="Power" 
          value={data.charging ? 'Charging' : 'Battery'} 
          subValue={data.batteryLevel !== null ? `${data.batteryLevel}%` : '84%'}
          active={!!data.charging}
        />
        <SensorCard 
          icon={<Sun className="w-4 h-4" />} 
          label="Ambient" 
          value="Indoor" 
          subValue="120 Lux"
          active={true}
        />
        <SensorCard 
          icon={<Smartphone className="w-4 h-4" />} 
          label="Screen" 
          value={data.screenOn ? 'Active' : 'Standby'} 
          subValue={`Last: ${Math.floor((Date.now() - data.lastInteraction) / 1000)}s ago`}
          active={data.screenOn}
        />
      </div>
    </section>
  );
}

function SensorCard({ icon, label, value, subValue, active }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  subValue: string;
  active: boolean;
}) {
  return (
    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
          {icon}
        </div>
        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
        <p className="font-semibold text-zinc-100">{value}</p>
        <p className="text-[10px] font-mono text-zinc-600 mt-0.5">{subValue}</p>
      </div>
    </div>
  );
}
