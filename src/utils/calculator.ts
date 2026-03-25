import { Precision, CalculatorConfig, CalculationResult, GPURecommendation, QuantizationRow, BuildSuggestion } from '../types';

export const BYTES_PER_PARAM: Record<Precision, number> = {
  fp32: 4,
  fp16: 2,
  bf16: 2,
  int8: 1,
  Q8_0: 1,
  Q5_K_M: 0.55,
  int4: 0.5,
  Q4_K_M: 0.45,
};

export const PRECISION_LABELS: Record<Precision, string> = {
  fp32: 'FP32 (Full)',
  fp16: 'FP16 (Half)',
  bf16: 'BF16 (Brain Float)',
  int8: 'INT8',
  Q8_0: 'GGUF Q8_0',
  Q5_K_M: 'GGUF Q5_K_M',
  int4: 'INT4',
  Q4_K_M: 'GGUF Q4_K_M',
};

export const FRAMEWORK_OVERHEAD: Record<string, number> = {
  'llama.cpp': 0.3,
  'ollama': 0.5,
  'transformers': 1.2,
  'vllm': 1.5,
  'exllamav2': 0.4,
  'lm-studio': 0.6,
};

export function calcWeightsMemoryGB(params_b: number, precision: Precision): number {
  return (params_b * 1e9 * BYTES_PER_PARAM[precision]) / 1e9;
}

export function calcKVCacheGB(config: CalculatorConfig): number {
  if (!config.kvCacheEnabled) return 0;
  const headDim = config.hidden_size / config.num_attention_heads;
  const bytes = BYTES_PER_PARAM[config.precision] > 2 ? 2 : BYTES_PER_PARAM[config.precision]; // KV cache typically in fp16
  return (2 * config.num_layers * config.num_kv_heads * headDim * config.contextLength * config.batchSize * bytes) / 1e9;
}

export function calcActivationOverheadGB(weightsGB: number): number {
  return weightsGB * 0.15;
}

export function calculate(config: CalculatorConfig): CalculationResult {
  const weightsMemoryGB = calcWeightsMemoryGB(config.parameters_b, config.precision);
  const kvCacheGB = calcKVCacheGB(config);
  const activationOverheadGB = calcActivationOverheadGB(weightsMemoryGB);
  const frameworkOverheadGB = FRAMEWORK_OVERHEAD[config.framework] ?? 0.8;
  const totalVRAM_GB = weightsMemoryGB + kvCacheGB + activationOverheadGB + frameworkOverheadGB;
  const systemRAM_GPU_GB = Math.max(8, weightsMemoryGB * 0.2);
  const systemRAM_CPU_GB = totalVRAM_GB + 4;
  const modelFileSizeGB = weightsMemoryGB; // on-disk ≈ weights memory

  let cpuFeasibility: 'yes' | 'slow' | 'not-recommended' = 'not-recommended';
  let estimatedTokensPerSecCPU: number | null = null;

  if (config.parameters_b <= 3) {
    cpuFeasibility = 'yes';
    estimatedTokensPerSecCPU = Math.round(20 / (BYTES_PER_PARAM[config.precision] / BYTES_PER_PARAM['Q4_K_M']));
  } else if (config.parameters_b <= 13) {
    cpuFeasibility = 'slow';
    estimatedTokensPerSecCPU = Math.max(1, Math.round(8 / (config.parameters_b / 7)));
  } else {
    cpuFeasibility = 'not-recommended';
    estimatedTokensPerSecCPU = null;
  }

  return {
    weightsMemoryGB,
    kvCacheGB,
    activationOverheadGB,
    frameworkOverheadGB,
    totalVRAM_GB,
    systemRAM_GPU_GB,
    systemRAM_CPU_GB,
    modelFileSizeGB,
    cpuFeasibility,
    estimatedTokensPerSecCPU,
  };
}

const GPU_DATABASE: Omit<GPURecommendation, 'fits' | 'tight'>[] = [
  { tier: 'budget', name: 'RTX 3060 12GB', vram: 12 },
  { tier: 'budget', name: 'RTX 4060 Ti 16GB', vram: 16 },
  { tier: 'mid-range', name: 'RTX 3090 24GB', vram: 24 },
  { tier: 'mid-range', name: 'RTX 4090 24GB', vram: 24 },
  { tier: 'professional', name: 'A10G 24GB', vram: 24 },
  { tier: 'professional', name: 'A100 40GB', vram: 40 },
  { tier: 'professional', name: 'A100 80GB', vram: 80 },
  { tier: 'professional', name: 'H100 80GB', vram: 80 },
];

export function getGPURecommendations(totalVRAM: number): GPURecommendation[] {
  return GPU_DATABASE.map(gpu => ({
    ...gpu,
    fits: gpu.vram >= totalVRAM,
    tight: gpu.vram >= totalVRAM && gpu.vram < totalVRAM * 1.3,
  }));
}

export function getMultiGPUSuggestion(totalVRAM: number): string | null {
  if (totalVRAM <= 24) return null;
  if (totalVRAM <= 48) return '2× 24GB GPUs (RTX 3090/4090)';
  if (totalVRAM <= 80) return '2× A100 40GB or 1× A100 80GB';
  if (totalVRAM <= 160) return '2× A100 80GB or 2× H100 80GB';
  return `${Math.ceil(totalVRAM / 80)}× A100/H100 80GB GPUs`;
}

const QUANT_ORDER: { precision: Precision; label: string; qualityLoss: string; speedFactor: number }[] = [
  { precision: 'fp32', label: 'FP32', qualityLoss: 'None', speedFactor: 0.5 },
  { precision: 'fp16', label: 'FP16', qualityLoss: 'Minimal', speedFactor: 1.0 },
  { precision: 'bf16', label: 'BF16', qualityLoss: 'Minimal', speedFactor: 1.0 },
  { precision: 'int8', label: 'INT8', qualityLoss: 'Low', speedFactor: 1.5 },
  { precision: 'Q8_0', label: 'GGUF Q8_0', qualityLoss: 'Low', speedFactor: 1.6 },
  { precision: 'Q5_K_M', label: 'GGUF Q5_K_M', qualityLoss: 'Low-Med', speedFactor: 2.0 },
  { precision: 'int4', label: 'INT4', qualityLoss: 'Medium', speedFactor: 2.2 },
  { precision: 'Q4_K_M', label: 'GGUF Q4_K_M', qualityLoss: 'Medium', speedFactor: 2.5 },
];

export function getQuantizationTable(config: CalculatorConfig): QuantizationRow[] {
  const baseSpeed = 30; // baseline tokens/sec for fp16 on a mid-range GPU at 7B
  const paramFactor = 7 / config.parameters_b;

  return QUANT_ORDER.map(q => {
    const tempConfig = { ...config, precision: q.precision };
    const result = calculate(tempConfig);
    const speed = Math.round(baseSpeed * paramFactor * q.speedFactor);
    return {
      precision: q.precision,
      label: q.label,
      modelSizeGB: result.weightsMemoryGB,
      vramNeededGB: result.totalVRAM_GB,
      qualityLoss: q.qualityLoss,
      tokensPerSec: `~${speed} t/s`,
    };
  });
}

export function getBuildSuggestions(totalVRAM: number, systemRAM: number, diskGB: number): BuildSuggestion[] {
  const builds: BuildSuggestion[] = [];
  const minStorage = Math.max(500, Math.ceil(diskGB * 3)); // 3x model size for OS + extras

  // ─── Budget / Small Model Build (≤ 12 GB VRAM) ───
  if (totalVRAM <= 12) {
    builds.push({
      tier: 'budget',
      label: 'Budget Desktop',
      description: 'Affordable build for small quantized models. Great for local chat with 7–8B parameter models.',
      estimatedCost: '$800 – $1,200',
      components: {
        cpu: { name: 'CPU', spec: 'AMD Ryzen 5 5600X / Intel i5-12400F', priceRange: '$120 – $170' },
        gpu: { name: 'GPU', spec: 'NVIDIA RTX 3060 12GB', priceRange: '$250 – $300' },
        ram: { name: 'RAM', spec: `${Math.max(16, Math.ceil(systemRAM / 8) * 8)}GB DDR4-3200`, priceRange: '$40 – $70' },
        storage: { name: 'Storage', spec: `${minStorage >= 1000 ? '1TB' : '500GB'} NVMe SSD`, priceRange: '$40 – $80' },
        motherboard: { name: 'Motherboard', spec: 'B550 / B660 ATX', priceRange: '$90 – $130' },
        psu: { name: 'PSU', spec: '550W 80+ Bronze', priceRange: '$50 – $70' },
        cooling: { name: 'Cooling', spec: 'Stock / Tower Air Cooler', priceRange: '$0 – $30' },
      },
      notes: [
        'Best for Q4/Q5 quantized 7B–8B models',
        'Can handle basic local chat at 15–30 tokens/sec',
        'Upgrade path: swap GPU to RTX 4060 Ti 16GB later',
      ],
    });
  }

  // ─── Enthusiast Build (≤ 24 GB VRAM) ───
  if (totalVRAM <= 24) {
    builds.push({
      tier: 'enthusiast',
      label: 'Enthusiast Desktop',
      description: 'High-performance desktop for up to 13B–27B parameter models with good quantization.',
      estimatedCost: '$1,800 – $2,800',
      components: {
        cpu: { name: 'CPU', spec: 'AMD Ryzen 7 7700X / Intel i7-13700K', priceRange: '$250 – $350' },
        gpu: { name: 'GPU', spec: 'NVIDIA RTX 4090 24GB', priceRange: '$1,200 – $1,600' },
        ram: { name: 'RAM', spec: `${Math.max(32, Math.ceil(systemRAM / 16) * 16)}GB DDR5-5600`, priceRange: '$80 – $130' },
        storage: { name: 'Storage', spec: `${minStorage >= 2000 ? '2TB' : '1TB'} NVMe Gen4 SSD`, priceRange: '$80 – $150' },
        motherboard: { name: 'Motherboard', spec: 'X670E / Z790 ATX', priceRange: '$180 – $280' },
        psu: { name: 'PSU', spec: '850W 80+ Gold', priceRange: '$100 – $140' },
        cooling: { name: 'Cooling', spec: '240mm AIO Liquid Cooler', priceRange: '$70 – $120' },
      },
      notes: [
        'Handles 13B models at fp16 or 27B at Q4 quantization',
        'RTX 4090 delivers excellent tokens/sec for local inference',
        'Sufficient for small server use (batch 2–4)',
      ],
    });
  }

  // ─── Workstation Build (≤ 48 GB VRAM, dual-GPU) ───
  if (totalVRAM > 24 && totalVRAM <= 80) {
    const needsDual = totalVRAM > 24;
    const gpuSpec = totalVRAM <= 48
      ? '2× NVIDIA RTX 4090 24GB'
      : 'NVIDIA A100 80GB (PCIe)';
    const gpuPrice = totalVRAM <= 48 ? '$2,400 – $3,200' : '$8,000 – $12,000';
    builds.push({
      tier: 'workstation',
      label: 'AI Workstation',
      description: `High-end workstation for 70B+ parameter models. ${needsDual ? 'Uses multi-GPU or professional GPU.' : ''}`,
      estimatedCost: totalVRAM <= 48 ? '$4,000 – $6,000' : '$12,000 – $18,000',
      components: {
        cpu: { name: 'CPU', spec: 'AMD Threadripper 7960X / Intel Xeon w5-3435X', priceRange: '$800 – $1,200' },
        gpu: { name: 'GPU', spec: gpuSpec, priceRange: gpuPrice },
        ram: { name: 'RAM', spec: `${Math.max(64, Math.ceil(systemRAM / 32) * 32)}GB DDR5-4800 ECC`, priceRange: '$200 – $400' },
        storage: { name: 'Storage', spec: '2TB NVMe Gen4 SSD + 4TB SATA SSD', priceRange: '$250 – $400' },
        motherboard: { name: 'Motherboard', spec: 'TRX50 / W790 Workstation Board', priceRange: '$400 – $700' },
        psu: { name: 'PSU', spec: '1200W 80+ Platinum', priceRange: '$200 – $300' },
        cooling: { name: 'Cooling', spec: '360mm AIO / Custom Loop', priceRange: '$150 – $300' },
      },
      notes: [
        `Requires ${needsDual ? 'multi-GPU setup or professional GPU' : 'high-end GPU'}`,
        'Consider NVLink bridge for dual-GPU setups if available',
        'ECC RAM recommended for stability on long inference runs',
        'Ensure motherboard has sufficient PCIe lanes for multi-GPU',
      ],
    });
  }

  // ─── Server Build (> 80 GB VRAM) ───
  if (totalVRAM > 80) {
    const gpuCount = Math.ceil(totalVRAM / 80);
    builds.push({
      tier: 'server',
      label: 'Inference Server',
      description: `Data-center class server for 200B+ parameter models. Requires ${gpuCount}× professional GPUs.`,
      estimatedCost: `$${(gpuCount * 15000 + 8000).toLocaleString()} – $${(gpuCount * 25000 + 12000).toLocaleString()}`,
      components: {
        cpu: { name: 'CPU', spec: 'Dual AMD EPYC 9454 / Intel Xeon 8480+', priceRange: '$5,000 – $10,000' },
        gpu: { name: 'GPU', spec: `${gpuCount}× NVIDIA H100 80GB SXM`, priceRange: `$${(gpuCount * 25000).toLocaleString()} – $${(gpuCount * 35000).toLocaleString()}` },
        ram: { name: 'RAM', spec: `${Math.max(256, Math.ceil(systemRAM / 64) * 64)}GB DDR5-4800 ECC RDIMM`, priceRange: '$1,000 – $3,000' },
        storage: { name: 'Storage', spec: '4TB NVMe RAID + 8TB SAS Storage', priceRange: '$1,500 – $3,000' },
        motherboard: { name: 'Motherboard', spec: 'Dual-Socket Server Board (Supermicro / Tyan)', priceRange: '$800 – $2,000' },
        psu: { name: 'PSU', spec: `${Math.max(2000, gpuCount * 700 + 800)}W Redundant PSU`, priceRange: '$500 – $1,500' },
        cooling: { name: 'Cooling', spec: 'Rack-mount Cooling / Liquid Cooling per GPU', priceRange: '$500 – $2,000' },
      },
      notes: [
        `Requires ${gpuCount}× H100/A100 GPUs with NVLink/NVSwitch`,
        'Consider cloud instances (AWS p5, GCP a3) as an alternative',
        'Total power draw will be significant — ensure adequate electrical infrastructure',
        'Rack-mount chassis recommended (4U+)',
      ],
    });
  }

  // If model is tiny enough for CPU-only, add a CPU-only build
  if (totalVRAM <= 4 && builds.length > 0) {
    builds.unshift({
      tier: 'budget',
      label: 'CPU-Only Build',
      description: 'No dedicated GPU needed! This small model runs well on CPU with enough RAM.',
      estimatedCost: '$400 – $600',
      components: {
        cpu: { name: 'CPU', spec: 'AMD Ryzen 5 5600G / Intel i5-12400', priceRange: '$100 – $150' },
        gpu: { name: 'GPU', spec: 'Integrated / Not Required', priceRange: '$0' },
        ram: { name: 'RAM', spec: `${Math.max(16, Math.ceil(systemRAM / 8) * 8)}GB DDR4-3200`, priceRange: '$35 – $60' },
        storage: { name: 'Storage', spec: '500GB NVMe SSD', priceRange: '$35 – $50' },
        motherboard: { name: 'Motherboard', spec: 'B550 / B660 mATX', priceRange: '$70 – $100' },
        psu: { name: 'PSU', spec: '400W 80+ Bronze', priceRange: '$35 – $50' },
        cooling: { name: 'Cooling', spec: 'Stock Cooler', priceRange: '$0' },
      },
      notes: [
        'CPU-only inference is viable for this model size',
        'Expect 5–20 tokens/sec depending on quantization',
        'Adding a budget GPU later can significantly boost speed',
      ],
    });
  }

  return builds;
}
