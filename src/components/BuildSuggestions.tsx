import { Wrench, DollarSign, Lightbulb, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { BuildSuggestion } from '../types';

interface BuildSuggestionsProps {
  builds: BuildSuggestion[];
}

const TIER_COLORS: Record<string, { bg: string; border: string; badge: string; icon: string }> = {
  budget: { bg: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-500/30', badge: 'bg-emerald-500/15 text-emerald-400', icon: 'from-emerald-500 to-teal-600' },
  enthusiast: { bg: 'from-blue-500/10 to-indigo-500/5', border: 'border-blue-500/30', badge: 'bg-blue-500/15 text-blue-400', icon: 'from-blue-500 to-indigo-600' },
  workstation: { bg: 'from-purple-500/10 to-violet-500/5', border: 'border-purple-500/30', badge: 'bg-purple-500/15 text-purple-400', icon: 'from-purple-500 to-violet-600' },
  server: { bg: 'from-amber-500/10 to-orange-500/5', border: 'border-amber-500/30', badge: 'bg-amber-500/15 text-amber-400', icon: 'from-amber-500 to-orange-600' },
};

const COMPONENT_ORDER: (keyof BuildSuggestion['components'])[] = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'cooling'];

const COMPONENT_EMOJI: Record<string, string> = {
  cpu: '🧠',
  gpu: '🎮',
  ram: '💾',
  storage: '💿',
  motherboard: '🔧',
  psu: '⚡',
  cooling: '❄️',
};

export default function BuildSuggestions({ builds }: BuildSuggestionsProps) {
  const [expandedIdx, setExpandedIdx] = useState<number>(0);

  if (builds.length === 0) return null;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="section-title mb-0">Suggested Builds</h3>
          <p className="text-[10px] text-[var(--text-secondary)]">PC & Server configurations tailored for your model</p>
        </div>
      </div>

      <div className="space-y-3">
        {builds.map((build, idx) => {
          const colors = TIER_COLORS[build.tier] || TIER_COLORS.budget;
          const isExpanded = expandedIdx === idx;

          return (
            <div
              key={idx}
              className={`rounded-xl border transition-all duration-300 overflow-hidden ${colors.border} bg-gradient-to-r ${colors.bg}`}
            >
              {/* Header — always visible */}
              <button
                onClick={() => setExpandedIdx(isExpanded ? -1 : idx)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colors.icon} flex items-center justify-center shadow-lg`}>
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{build.label}</span>
                      <span className={`badge text-[10px] ${colors.badge}`}>{build.tier.toUpperCase()}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-tight">{build.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 text-xs font-semibold text-[var(--text-primary)]">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      {build.estimatedCost}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 animate-slide-up">
                  {/* Mobile price */}
                  <div className="sm:hidden mb-3 flex items-center gap-1 text-xs font-semibold text-[var(--text-primary)]">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Estimated: {build.estimatedCost}
                  </div>

                  {/* Parts Table */}
                  <div className="rounded-lg border border-[var(--border)] overflow-hidden mb-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[var(--bg-secondary)]">
                          <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-semibold w-24">Component</th>
                          <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-semibold">Specification</th>
                          <th className="text-right py-2 px-3 text-[var(--text-secondary)] font-semibold w-28">Est. Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {COMPONENT_ORDER.map((key) => {
                          const comp = build.components[key];
                          return (
                            <tr key={key} className="border-t border-[var(--border)]/50 hover:bg-brand-500/5 transition-colors">
                              <td className="py-2 px-3 font-semibold text-[var(--text-primary)]">
                                <span className="mr-1.5">{COMPONENT_EMOJI[key]}</span>
                                {comp.name}
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px] text-[var(--text-primary)]">{comp.spec}</td>
                              <td className="py-2 px-3 text-right font-mono text-[11px] text-emerald-400">{comp.priceRange}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Notes */}
                  {build.notes.length > 0 && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)]">
                      <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <ul className="space-y-1">
                        {build.notes.map((note, ni) => (
                          <li key={ni} className="text-[11px] text-[var(--text-secondary)] leading-relaxed">• {note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
