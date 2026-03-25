import { ChevronDown, Settings2, Layers, Zap } from 'lucide-react';
import { useState } from 'react';
import { CalculatorConfig, Framework, InferenceMode, ModelPreset, Precision } from '../types';
import { PRECISION_LABELS } from '../utils/calculator';
import Tooltip from './Tooltip';

interface ConfigurationPanelProps {
  config: CalculatorConfig;
  models: ModelPreset[];
  selectedModelId: string;
  isCustom: boolean;
  inferenceMode: InferenceMode;
  onModelChange: (modelId: string) => void;
  onInferenceModeChange: (mode: InferenceMode) => void;
  onUpdateConfig: (partial: Partial<CalculatorConfig>) => void;
}

const FRAMEWORKS: { value: Framework; label: string }[] = [
  { value: 'ollama', label: 'Ollama' },
  { value: 'llama.cpp', label: 'llama.cpp (GGUF)' },
  { value: 'transformers', label: 'HuggingFace Transformers' },
  { value: 'vllm', label: 'vLLM' },
  { value: 'exllamav2', label: 'ExLlamaV2' },
  { value: 'lm-studio', label: 'LM Studio' },
];

const INFERENCE_MODES: { value: InferenceMode; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'local', label: 'Local Chat', desc: 'Batch 1', icon: <Zap className="w-4 h-4" /> },
  { value: 'small-server', label: 'Small Server', desc: 'Batch 4', icon: <Layers className="w-4 h-4" /> },
  { value: 'production', label: 'Production', desc: 'Batch 32', icon: <Settings2 className="w-4 h-4" /> },
];

const CONTEXT_PRESETS = [512, 2048, 4096, 8192, 16384, 32768, 65536, 131072];

export default function ConfigurationPanel({
  config,
  models,
  selectedModelId,
  isCustom,
  inferenceMode,
  onModelChange,
  onInferenceModeChange,
  onUpdateConfig,
}: ConfigurationPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Model Selection */}
      <div className="card">
        <h2 className="section-title flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          Model
        </h2>
        <div className="space-y-3">
          <div>
            <label className="label">
              Select Model <Tooltip text="Choose a pre-configured model or select Custom to enter your own parameters." />
            </label>
            <div className="relative">
              <select
                id="model-select"
                value={selectedModelId}
                onChange={(e) => onModelChange(e.target.value)}
                className="input-field appearance-none pr-10 cursor-pointer"
              >
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.parameters_b}B)</option>
                ))}
                <option value="custom">✏️ Custom Model</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
            </div>
          </div>

          {/* Parameters display */}
          <div className="flex items-center gap-2 text-sm">
            <span className="badge bg-brand-500/15 text-brand-400 font-mono">{config.parameters_b}B params</span>
            <span className="badge bg-purple-500/15 text-purple-400 font-mono">{config.num_layers} layers</span>
          </div>
        </div>
      </div>

      {/* Precision */}
      <div className="card">
        <h2 className="section-title flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Quantization
        </h2>
        <label className="label">
          Precision / Dtype <Tooltip text="Lower precision uses less memory but may slightly reduce output quality. GGUF quantizations are optimized for llama.cpp / Ollama." />
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PRECISION_LABELS) as Precision[]).map(p => (
            <button
              key={p}
              onClick={() => onUpdateConfig({ precision: p })}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all duration-200 border ${
                config.precision === p
                  ? 'bg-brand-600/20 border-brand-500 text-brand-300 shadow-sm shadow-brand-500/20'
                  : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-500/30'
              }`}
            >
              {PRECISION_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Context Length */}
      <div className="card">
        <h2 className="section-title">Context Length</h2>
        <label className="label">
          Tokens <Tooltip text="The number of tokens the model can process at once. Higher context = more memory needed." />
        </label>
        <div className="flex gap-2 mb-3">
          <input
            id="context-length-input"
            type="number"
            value={config.contextLength}
            onChange={(e) => onUpdateConfig({ contextLength: Math.max(1, parseInt(e.target.value) || 512) })}
            className="input-field flex-1"
            min={1}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CONTEXT_PRESETS.map(v => (
            <button
              key={v}
              onClick={() => onUpdateConfig({ contextLength: v })}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all ${
                config.contextLength === v
                  ? 'bg-brand-600 text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-brand-600/20'
              }`}
            >
              {v >= 1024 ? `${v / 1024}K` : v}
            </button>
          ))}
        </div>
      </div>

      {/* Inference Mode */}
      <div className="card">
        <h2 className="section-title">Inference Mode</h2>
        <div className="grid grid-cols-3 gap-2">
          {INFERENCE_MODES.map(mode => (
            <button
              key={mode.value}
              onClick={() => onInferenceModeChange(mode.value)}
              className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-xs font-medium transition-all duration-200 border ${
                inferenceMode === mode.value
                  ? 'bg-brand-600/20 border-brand-500 text-brand-300'
                  : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-500/30'
              }`}
            >
              {mode.icon}
              <span className="font-semibold">{mode.label}</span>
              <span className="text-[10px] opacity-70">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Framework */}
      <div className="card">
        <h2 className="section-title">Runtime Framework</h2>
        <label className="label">
          Framework <Tooltip text="Different runtimes have varying memory overhead. llama.cpp/Ollama are most memory-efficient." />
        </label>
        <div className="relative">
          <select
            id="framework-select"
            value={config.framework}
            onChange={(e) => onUpdateConfig({ framework: e.target.value as Framework })}
            className="input-field appearance-none pr-10 cursor-pointer"
          >
            {FRAMEWORKS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="card">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-sm font-medium text-[var(--text-secondary)] hover:text-brand-400 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> Advanced Settings
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-3 animate-slide-up">
            {/* Batch Size Override */}
            <div>
              <label className="label">
                Batch Size <Tooltip text="Number of simultaneous inference requests. Higher batch = more VRAM." />
              </label>
              <input
                id="batch-size-input"
                type="number"
                value={config.batchSize}
                onChange={(e) => onUpdateConfig({ batchSize: Math.max(1, parseInt(e.target.value) || 1) })}
                className="input-field"
                min={1}
              />
            </div>

            {/* KV Cache Toggle */}
            <div className="flex items-center justify-between">
              <label className="label mb-0">
                KV Cache <Tooltip text="Key-Value cache stores computed attention tensors to speed up generation. Uses significant memory for long contexts." />
              </label>
              <button
                onClick={() => onUpdateConfig({ kvCacheEnabled: !config.kvCacheEnabled })}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  config.kvCacheEnabled ? 'bg-brand-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    config.kvCacheEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {/* Custom model parameters */}
            {isCustom && (
              <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                <p className="text-xs font-semibold text-brand-400">Custom Model Parameters</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Parameters (B)</label>
                    <input
                      type="number"
                      value={config.parameters_b}
                      onChange={(e) => onUpdateConfig({ parameters_b: parseFloat(e.target.value) || 1 })}
                      className="input-field"
                      step={0.1}
                      min={0.1}
                    />
                  </div>
                  <div>
                    <label className="label">Layers</label>
                    <input
                      type="number"
                      value={config.num_layers}
                      onChange={(e) => onUpdateConfig({ num_layers: parseInt(e.target.value) || 1 })}
                      className="input-field"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="label">Hidden Size</label>
                    <input
                      type="number"
                      value={config.hidden_size}
                      onChange={(e) => onUpdateConfig({ hidden_size: parseInt(e.target.value) || 1 })}
                      className="input-field"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="label">Attention Heads</label>
                    <input
                      type="number"
                      value={config.num_attention_heads}
                      onChange={(e) => onUpdateConfig({ num_attention_heads: parseInt(e.target.value) || 1 })}
                      className="input-field"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="label">KV Heads</label>
                    <input
                      type="number"
                      value={config.num_kv_heads}
                      onChange={(e) => onUpdateConfig({ num_kv_heads: parseInt(e.target.value) || 1 })}
                      className="input-field"
                      min={1}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
