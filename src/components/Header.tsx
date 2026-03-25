import { Moon, Sun, Cpu } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
}

export default function Header({ darkMode, onToggleTheme }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--border)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              LLM Inference Calculator
            </h1>
            <p className="text-[10px] text-[var(--text-secondary)] font-medium tracking-wide uppercase">
              Hardware Requirements Estimator
            </p>
          </div>
        </div>
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-brand-500/50 transition-all duration-200"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-500" />}
        </button>
      </div>
    </header>
  );
}
