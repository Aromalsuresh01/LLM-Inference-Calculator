import { useState, useMemo, useEffect } from 'react';
import { CalculatorConfig, Framework, InferenceMode, Precision } from './types';
import { ModelPreset } from './types';
import modelsData from './data/models.json';
import { calculate, getGPURecommendations, getMultiGPUSuggestion, getQuantizationTable, getBuildSuggestions } from './utils/calculator';
import Header from './components/Header';
import ConfigurationPanel from './components/ConfigurationPanel';
import ResultsDashboard from './components/ResultsDashboard';

const models = modelsData as ModelPreset[];

const INFERENCE_MODE_BATCH: Record<InferenceMode, number> = {
  local: 1,
  'small-server': 4,
  production: 32,
};

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState('llama3-8b');
  const [isCustom, setIsCustom] = useState(false);

  const defaultModel = models.find(m => m.id === 'llama3-8b')!;

  const [config, setConfig] = useState<CalculatorConfig>({
    modelId: defaultModel.id,
    parameters_b: defaultModel.parameters_b,
    num_layers: defaultModel.num_layers,
    hidden_size: defaultModel.hidden_size,
    num_attention_heads: defaultModel.num_attention_heads,
    num_kv_heads: defaultModel.num_kv_heads,
    precision: 'Q4_K_M' as Precision,
    contextLength: defaultModel.default_context_length,
    batchSize: 1,
    kvCacheEnabled: true,
    architecture: defaultModel.architecture,
    framework: 'ollama' as Framework,
  });

  const [inferenceMode, setInferenceMode] = useState<InferenceMode>('local');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // When model selection changes
  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    if (modelId === 'custom') {
      setIsCustom(true);
      return;
    }
    setIsCustom(false);
    const model = models.find(m => m.id === modelId);
    if (model) {
      setConfig(prev => ({
        ...prev,
        modelId: model.id,
        parameters_b: model.parameters_b,
        num_layers: model.num_layers,
        hidden_size: model.hidden_size,
        num_attention_heads: model.num_attention_heads,
        num_kv_heads: model.num_kv_heads,
        contextLength: model.default_context_length,
        architecture: model.architecture,
      }));
    }
  };

  const handleInferenceModeChange = (mode: InferenceMode) => {
    setInferenceMode(mode);
    setConfig(prev => ({
      ...prev,
      batchSize: INFERENCE_MODE_BATCH[mode],
    }));
  };

  const updateConfig = (partial: Partial<CalculatorConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  };

  // Derived calculations
  const result = useMemo(() => calculate(config), [config]);
  const gpuRecs = useMemo(() => getGPURecommendations(result.totalVRAM_GB), [result.totalVRAM_GB]);
  const multiGPU = useMemo(() => getMultiGPUSuggestion(result.totalVRAM_GB), [result.totalVRAM_GB]);
  const quantTable = useMemo(() => getQuantizationTable(config), [config]);
  const buildSuggestions = useMemo(() => getBuildSuggestions(result.totalVRAM_GB, result.systemRAM_GPU_GB, result.modelFileSizeGB), [result]);

  const handleShare = () => {
    const state = btoa(JSON.stringify(config));
    const url = `${window.location.origin}${window.location.pathname}?c=${state}`;
    navigator.clipboard.writeText(url);
    alert('Shareable URL copied to clipboard!');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-4 xl:col-span-4">
            <ConfigurationPanel
              config={config}
              models={models}
              selectedModelId={selectedModelId}
              isCustom={isCustom}
              inferenceMode={inferenceMode}
              onModelChange={handleModelChange}
              onInferenceModeChange={handleInferenceModeChange}
              onUpdateConfig={updateConfig}
            />
          </div>
          {/* Right Panel */}
          <div className="lg:col-span-8 xl:col-span-8">
            <ResultsDashboard
              config={config}
              result={result}
              gpuRecs={gpuRecs}
              multiGPU={multiGPU}
              quantTable={quantTable}
              buildSuggestions={buildSuggestions}
              onShare={handleShare}
            />
          </div>
        </div>
      </main>
      <footer className="text-center py-4 text-xs text-[var(--text-secondary)] border-t border-[var(--border)]">
        LLM Inference Calculator — All calculations run client-side. No data is sent anywhere.
      </footer>
    </div>
  );
}

export default App;
