# Enhanced PRD & Implementation Plan: LLM Inference Calculator

## 1. Project Overview
A client-side only single-page application (SPA) that calculates hardware requirements (RAM, VRAM, and GPU recommendations) for running Large Language Models (LLMs) locally. This document provides a detailed blueprint for an AI agent or developer to immediately start coding the project.

## 2. Tech Stack & Setup
- **Core Framework:** React 18+ via Vite (TypeScript is highly recommended for strong typing of model preset schemas).
- **Styling:** Tailwind CSS for responsive, utility-first styling.
- **Icons:** `lucide-react`.
- **UI Components (Optional but recommended):** `shadcn/ui` or headless UI libraries for accessible dropdowns, sliders, and tooltips.
- **State Management:** React `useState` / `useMemo` (the app is simple enough that Redux/Zustand is unnecessary; computations are derived from state).

## 3. Data Architecture
All data is static and handled client-side. 

### Pre-configured Models (`src/data/models.json`)
Create a JSON file with predefined models.
```typescript
// Type definition for reference
export interface ModelPreset {
  id: string;
  name: string;
  parameters_b: number; // e.g., 8 for 8B
  num_layers: number;
  hidden_size: number;
  num_attention_heads: number;
  num_kv_heads: number;
  default_context_length: number;
  architecture: 'decoder-only' | 'encoder-decoder';
  supported_quantizations: string[]; 
}
```

## 4. Component Tree Architecture
```text
App
 ├── Header (Title, Theme Toggle, GitHub/Info Link)
 ├── MainLayout (Grid/Flex - 1 col mobile, 2 cols desktop)
 │    ├── ConfigurationPanel (Left)
 │    │    ├── ModelSelector (Select from JSON or "Custom")
 │    │    ├── PrecisionSelector (Radio/Dropdown: fp16, int8, Q4_K_M...)
 │    │    ├── ContextLengthSlider (Numeric input + slider, e.g., 512 to 128k)
 │    │    ├── InferenceModeSelector (Local Chat/Small Server/Production API -> sets Batch Size)
 │    │    └── AdvancedSettingsCollapsible
 │    │         ├── Batch Size Override
 │    │         ├── KV Cache Toggle
 │    │         └── Custom Model Architecture Inputs (Layers, Heads, etc.)
 │    │
 │    └── ResultsDashboard (Right)
 │         ├── PrimaryMetricsCards
 │         │    ├── TotalVRAMCard (Shows Progress Bar against typical GPU sizes like 12GB, 24GB, 80GB)
 │         │    └── SystemRAMCard 
 │         ├── HardwareRecommendations
 │         │    └── GPU Tiers (Budget, Mid-range, Pro based on VRAM result)
 │         ├── QuantizationComparisonTable (Auto-generates VRAM requirements across all quantizations for the selected model)
 │         └── ShareButton (Generates URL with base64 encoded state)
 └── Footer
```

## 5. Core Calculation Engine (`src/utils/calculator.ts`)
Isolate the math logic into pure functions so it can be easily tested and reused.

**Constants: Bytes per parameter based on precision:**
- `fp32`: 4 bytes
- `fp16` / `bf16`: 2 bytes
- `int8` / `Q8_0`: 1 byte
- `Q5_K_M`: 0.55 bytes
- `int4` / `Q4_K_M`: 0.45 bytes

**Formulas to implement:**
1. **Weights Memory (GB)**
   `weights_gb = (params_b * 1e9 * bytes_per_param) / 1024^3`
   *(Note: The original PRD uses `/ 1e9` for GB, but typically memory is `1024^3` (GiB). Ensure consistency, ideally using standard GB (1e9) as stated in PRD).*

2. **KV Cache Memory (GB)**
   `kv_cache_gb = (2 * num_layers * num_kv_heads * head_dim * context_length * batch_size * bytes_per_param) / 1e9`
   *Where `head_dim = hidden_size / num_attention_heads`*

3. **Activation Overhead (GB)**
   Typically around 10-20% of weights. 
   `activation_gb = weights_gb * 0.15`

4. **Total VRAM (GB)**
   `total_vram = weights_gb + kv_cache_gb + activation_gb + framework_overhead (e.g., 0.8)`

5. **System RAM (GB)**
   If fully on GPU: `system_ram = max(8, weights_gb * 0.2)`
   If CPU offloaded: `system_ram = total_vram + 4` (OS overhead)

## 6. Implementation Steps for AI Coding Agent
1. **Scaffold Project:** Run standard setup for React + Vite + TypeScript + Tailwind.
2. **Setup Foundations:** Create the folder structure (`src/components`, `src/utils`, `src/data`, `src/hooks`).
3. **Implement Math Engine:** Write `src/utils/calculator.ts` with all the pure functions for calculating requirements. Include a function to determine GPU recommendations (e.g., if VRAM < 12GB -> RTX 3060; if < 24GB -> RTX 3090/4090).
4. **Create Model Data:** Populate `src/data/models.json` with at least 5 baseline models (Llama-3-8B, Llama-3-70B, Mistral-7B, Mixtral-8x7B, Phi-3-Mini) using correct architecture numbers.
5. **Build State & Context:** Create the main App state incorporating all form variables.
6. **Build UI - Inputs:** Implement the Left Panel forms. Make them highly interactive.
7. **Build UI - Results:** Implement the Right Panel. Use visual cues (Green/Yellow/Red text for VRAM fits). Add the 'Quantization Comparison Table' to show how the model scales.
8. **Final Polish:** Ensure responsive design (stack panels on mobile) and add tooltips using an icon library to explain terms like "KV Cache" to beginners.
