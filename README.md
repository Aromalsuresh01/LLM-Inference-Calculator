# LLM Inference Calculator

**LLM Inference Calculator** is a fast, client-side web app that estimates the hardware requirements for running Large Language Models locally. Calculate VRAM, system RAM, and disk space for models like LLaMA 3 and Mistral across various quantizations. Get real-time GPU recommendations and tailored PC/Server build suggestions to optimize your AI setup.

![image](https://github.com/user-attachments/assets/placeholder-image-update-later)

## 🚀 Features

*   **12 Pre-configured Models**: Includes popular architectures like LLaMA 3, Mistral, Mixtral, Phi-3, Gemma, Qwen, and DeepSeek.
*   **Custom Model Support**: Manually enter parameters, layers, and hidden sizes for unlisted models.
*   **Quantization Types**: Instantly switch between FP32, FP16, INT8, and various GGUF formats (Q4_K_M, Q5_K_M, Q8_0, etc.) to see how precision impacts memory.
*   **Hardware Recommendations**:
    *   **GPU Engine**: Identifies whether the model fits securely, tightly, or not at all on popular GPUs (RTX 3060, 4090, A100).
    *   **Build Suggestions**: Generates complete PC or Server hardware builds (CPU, GPU, RAM, Storage, PSU) tailored specifically to the model's exact RAM and VRAM requirements.
*   **Quantization Comparison**: Side-by-side table analyzing VRAM, disk space, and estimated speed across all precisions.
*   **Client-Side Privacy**: All math and rendering happen entirely in your browser. No data is sent to external servers.

## 🛠️ Tech Stack

*   **Frontend**: React 18, TypeScript, Vite
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React

## 💻 Running Locally

To get a local copy up and running, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Aromalsuresh01/LLM-Inference-Calculator.git
    cd LLM-Inference-Calculator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

4.  **Open in Browser:**
    Navigate to `http://localhost:5173/`

## 📐 How it Works

The calculator uses standard tensor math formulas to estimate memory footprint:
*   **Weights Memory**: `parameters_B × bytes_per_param`
*   **KV Cache**: `2 × layers × kv_heads × head_dim × context_len × batch × bytes`
*   **Total VRAM**: `Weights + KV Cache + Activations (~15%) + Framework Overhead`

*Developed as an open-source tool for the local AI community.*
