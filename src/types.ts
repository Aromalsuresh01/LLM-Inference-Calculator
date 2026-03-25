export interface ModelPreset {
  id: string;
  name: string;
  parameters_b: number;
  num_layers: number;
  hidden_size: number;
  num_attention_heads: number;
  num_kv_heads: number;
  default_context_length: number;
  architecture: 'decoder-only' | 'encoder-decoder';
  supported_quantizations: string[];
}

export type Precision = 'fp32' | 'fp16' | 'bf16' | 'int8' | 'int4' | 'Q4_K_M' | 'Q5_K_M' | 'Q8_0';

export type InferenceMode = 'local' | 'small-server' | 'production';

export type Framework = 'llama.cpp' | 'ollama' | 'transformers' | 'vllm' | 'exllamav2' | 'lm-studio';

export interface CalculatorConfig {
  modelId: string;
  parameters_b: number;
  num_layers: number;
  hidden_size: number;
  num_attention_heads: number;
  num_kv_heads: number;
  precision: Precision;
  contextLength: number;
  batchSize: number;
  kvCacheEnabled: boolean;
  architecture: 'decoder-only' | 'encoder-decoder';
  framework: Framework;
}

export interface CalculationResult {
  weightsMemoryGB: number;
  kvCacheGB: number;
  activationOverheadGB: number;
  frameworkOverheadGB: number;
  totalVRAM_GB: number;
  systemRAM_GPU_GB: number;
  systemRAM_CPU_GB: number;
  modelFileSizeGB: number;
  cpuFeasibility: 'yes' | 'slow' | 'not-recommended';
  estimatedTokensPerSecCPU: number | null;
}

export interface GPURecommendation {
  tier: 'budget' | 'mid-range' | 'professional' | 'cloud';
  name: string;
  vram: number;
  fits: boolean;
  tight: boolean;
}

export interface QuantizationRow {
  precision: Precision;
  label: string;
  modelSizeGB: number;
  vramNeededGB: number;
  qualityLoss: string;
  tokensPerSec: string;
}

export interface BuildComponent {
  name: string;
  spec: string;
  priceRange: string;
}

export interface BuildSuggestion {
  tier: 'budget' | 'enthusiast' | 'workstation' | 'server';
  label: string;
  description: string;
  estimatedCost: string;
  components: {
    cpu: BuildComponent;
    gpu: BuildComponent;
    ram: BuildComponent;
    storage: BuildComponent;
    motherboard: BuildComponent;
    psu: BuildComponent;
    cooling: BuildComponent;
  };
  notes: string[];
}
