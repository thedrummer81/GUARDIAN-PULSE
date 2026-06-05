import React from 'react';
import { ActivityPattern } from '../types';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';

export default function ActivityLog({ 
  patterns, 
  onDelete 
}: { 
  patterns: ActivityPattern[];
  onDelete?: (id: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Learned Baseline</h2>
      </div>
      <div className="space-y-3">
        {patterns.map((pattern) => (
          <div key={pattern.id} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between group hover:bg-zinc-900 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                pattern.status === 'learned' 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}>
                {pattern.status === 'learned' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-medium text-zinc-200">{pattern.name}</p>
                <p className="text-xs text-zinc-500 font-mono">{pattern.startTime} — {pattern.endTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                pattern.status === 'learned' 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : 'bg-zinc-800 text-zinc-500'
              }`}>
                {pattern.status}
              </span>
              {onDelete && (
                <button 
                  onClick={() => onDelete(pattern.id)}
                  className="p-2 rounded-lg text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {patterns.length === 0 && (
          <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-2xl">
            <p className="text-zinc-500 text-sm italic">No activity patterns set yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
