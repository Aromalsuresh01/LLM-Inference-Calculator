import {
  MemoryStick,
  MonitorSpeaker,
  HardDrive,
  Cpu,
  Share2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Server,
} from 'lucide-react';
import { CalculatorConfig, CalculationResult, GPURecommendation, QuantizationRow, BuildSuggestion } from '../types';
import Tooltip from './Tooltip';
import BuildSuggestionsComponent from './BuildSuggestions';

interface ResultsDashboardProps {
  config: CalculatorConfig;
  result: CalculationResult;
  gpuRecs: GPURecommendation[];
  multiGPU: string | null;
  quantTable: QuantizationRow[];
  buildSuggestions: BuildSuggestion[];
  onShare: () => void;
}

function formatGB(gb: number): string {
  return gb < 0.01 ? '<0.01' : gb.toFixed(2);
}

function VRAMBar({ used, label, capacity }: { used: number; label: string; capacity: number }) {
  const pct = Math.min(100, (used / capacity) * 100);
  const color = pct <= 70 ? 'bg-emerald-500' : pct <= 90 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[10px] font-mono text-[var(--text-secondary)] mb-1">
        <span>{label}</span>
        <span>{formatGB(used)} / {capacity} GB ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-2.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
        <div className={`h-full rounded-full progress-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: 'yes' | 'slow' | 'not-recommended' }) {
  switch (status) {
    case 'yes':
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case 'slow':
      return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    case 'not-recommended':
      return <XCircle className="w-5 h-5 text-red-400" />;
  }
}

export default function ResultsDashboard({
  config,
  result,
  gpuRecs,
  multiGPU,
  quantTable,
  buildSuggestions,
  onShare,
}: ResultsDashboardProps) {
  const fittingGPUs = gpuRecs.filter(g => g.fits);
  const bestBudget = fittingGPUs.find(g => g.tier === 'budget');
  const bestMid = fittingGPUs.find(g => g.tier === 'mid-range');
  const bestPro = fittingGPUs.find(g => g.tier === 'professional');

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Share button */}
      <div className="flex justify-end">
        <button onClick={onShare} className="btn-primary flex items-center gap-2 text-xs">
          <Share2 className="w-3.5 h-3.5" /> Copy Shareable Link
        </button>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total VRAM */}
        <div className="card-glow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <MonitorSpeaker className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total VRAM</h3>
              <Tooltip text="Total GPU memory needed to load the model, KV cache, activations, and framework overhead." />
            </div>
          </div>
          <p className="text-3xl font-extrabold font-mono glow-text mb-3">
            {formatGB(result.totalVRAM_GB)} <span className="text-base font-medium text-[var(--text-secondary)]">GB</span>
          </p>

          {/* VRAM bars for common GPU sizes */}
          <VRAMBar used={result.totalVRAM_GB} label="12GB GPU" capacity={12} />
          <VRAMBar used={result.totalVRAM_GB} label="24GB GPU" capacity={24} />
          <VRAMBar used={result.totalVRAM_GB} label="80GB GPU" capacity={80} />

          {/* Breakdown */}
          <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Weights</span>
              <span className="font-mono">{formatGB(result.weightsMemoryGB)} GB</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">KV Cache</span>
              <span className="font-mono">{formatGB(result.kvCacheGB)} GB</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Activations</span>
              <span className="font-mono">{formatGB(result.activationOverheadGB)} GB</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Framework</span>
              <span className="font-mono">{formatGB(result.frameworkOverheadGB)} GB</span>
            </div>
          </div>
        </div>

        {/* System RAM & Storage */}
        <div className="space-y-4">
          {/* RAM */}
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <MemoryStick className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">System RAM</h3>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">GPU Mode</span>
                <span className="font-mono font-semibold">{formatGB(result.systemRAM_GPU_GB)} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">CPU Offload</span>
                <span className="font-mono font-semibold">{formatGB(result.systemRAM_CPU_GB)} GB</span>
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Disk Space</h3>
            </div>
            <p className="text-2xl font-extrabold font-mono">
              {formatGB(result.modelFileSizeGB)} <span className="text-sm font-medium text-[var(--text-secondary)]">GB</span>
            </p>
          </div>

          {/* CPU Feasibility */}
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">CPU-Only</h3>
            </div>
            <div className="flex items-center gap-3">
              <StatusIcon status={result.cpuFeasibility} />
              <div>
                <p className="text-sm font-semibold capitalize">
                  {result.cpuFeasibility === 'yes' ? 'Feasible' : result.cpuFeasibility === 'slow' ? 'Possible but Slow' : 'Not Recommended'}
                </p>
                {result.estimatedTokensPerSecCPU !== null && (
                  <p className="text-xs text-[var(--text-secondary)] font-mono">~{result.estimatedTokensPerSecCPU} tokens/sec</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GPU Recommendations */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-4 h-4 text-brand-400" />
          <h3 className="section-title mb-0">GPU Recommendations</h3>
        </div>
        {multiGPU && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Model exceeds single-GPU capacity. Suggestion: <strong>{multiGPU}</strong></span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {gpuRecs.map((gpu, i) => (
            <div
              key={i}
              className={`px-3 py-2.5 rounded-xl border text-xs transition-all ${
                gpu.fits
                  ? gpu.tight
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-red-500/20 bg-red-500/5 opacity-60'
              }`}
            >
              <p className="font-semibold text-[var(--text-primary)] truncate">{gpu.name}</p>
              <p className="text-[10px] text-[var(--text-secondary)] font-mono">{gpu.vram} GB VRAM</p>
              <div className="mt-1">
                {gpu.fits ? (
                  gpu.tight ? (
                    <span className="badge-yellow text-[10px]">Tight Fit</span>
                  ) : (
                    <span className="badge-green text-[10px]">✓ Fits</span>
                  )
                ) : (
                  <span className="badge-red text-[10px]">✗ Insufficient</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Builds */}
      <BuildSuggestionsComponent builds={buildSuggestions} />

      {/* Quantization Comparison Table */}
      <div className="card overflow-x-auto">
        <h3 className="section-title mb-3">Quantization Comparison — {config.parameters_b}B Model</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2 px-2 text-[var(--text-secondary)] font-semibold">Quantization</th>
              <th className="text-right py-2 px-2 text-[var(--text-secondary)] font-semibold">Model Size</th>
              <th className="text-right py-2 px-2 text-[var(--text-secondary)] font-semibold">VRAM Needed</th>
              <th className="text-center py-2 px-2 text-[var(--text-secondary)] font-semibold">Quality Loss</th>
              <th className="text-right py-2 px-2 text-[var(--text-secondary)] font-semibold">Speed (est.)</th>
            </tr>
          </thead>
          <tbody>
            {quantTable.map((row) => (
              <tr
                key={row.precision}
                className={`border-b border-[var(--border)]/50 transition-colors hover:bg-brand-500/5 ${
                  row.precision === config.precision ? 'bg-brand-500/10' : ''
                }`}
              >
                <td className="py-2 px-2 font-mono font-semibold">{row.label}</td>
                <td className="py-2 px-2 text-right font-mono">{formatGB(row.modelSizeGB)} GB</td>
                <td className="py-2 px-2 text-right font-mono">{formatGB(row.vramNeededGB)} GB</td>
                <td className="py-2 px-2 text-center">
                  <span
                    className={`badge text-[10px] ${
                      row.qualityLoss === 'None'
                        ? 'badge-green'
                        : row.qualityLoss === 'Minimal' || row.qualityLoss === 'Low'
                        ? 'badge-yellow'
                        : 'badge-red'
                    }`}
                  >
                    {row.qualityLoss}
                  </span>
                </td>
                <td className="py-2 px-2 text-right font-mono text-[var(--text-secondary)]">{row.tokensPerSec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* How is this calculated? */}
      <details className="card group">
        <summary className="cursor-pointer text-sm font-medium text-[var(--text-secondary)] hover:text-brand-400 transition-colors flex items-center gap-2">
          <span>📐 How is this calculated?</span>
        </summary>
        <div className="mt-3 text-xs text-[var(--text-secondary)] space-y-2 leading-relaxed">
          <p><strong className="text-[var(--text-primary)]">Weights Memory:</strong> <code className="font-mono bg-[var(--bg-secondary)] px-1 rounded">params_B × bytes_per_param</code></p>
          <p><strong className="text-[var(--text-primary)]">KV Cache:</strong> <code className="font-mono bg-[var(--bg-secondary)] px-1 rounded">2 × layers × kv_heads × head_dim × context_len × batch × bytes</code></p>
          <p><strong className="text-[var(--text-primary)]">Activations:</strong> ~15% of weights memory overhead</p>
          <p><strong className="text-[var(--text-primary)]">Total VRAM:</strong> <code className="font-mono bg-[var(--bg-secondary)] px-1 rounded">weights + KV cache + activations + framework overhead</code></p>
          <p><strong className="text-[var(--text-primary)]">System RAM (GPU):</strong> <code className="font-mono bg-[var(--bg-secondary)] px-1 rounded">max(8GB, weights × 0.2)</code></p>
          <p><strong className="text-[var(--text-primary)]">System RAM (CPU offload):</strong> <code className="font-mono bg-[var(--bg-secondary)] px-1 rounded">total_vram + 4GB</code></p>
        </div>
      </details>
    </div>
  );
}
