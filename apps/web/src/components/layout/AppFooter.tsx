import React from 'react';
import {
  Activity,
  BarChart3,
  Compass,
  FileText,
  GitBranch,
  ExternalLink,
  ShieldCheck,
  Database,
  CloudRain,
  Sparkles
} from 'lucide-react';
import { navigate } from '../../lib/router.js';

export const AppFooter: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/90 bg-[#030611] text-slate-400 pt-12 pb-8 mt-auto w-full">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-10">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Col 1: Brand & National Context (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 p-[1px] shadow-lg shadow-sky-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <Activity className="w-4 h-4 text-sky-400" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-lg text-white tracking-tight">
                  Dengue<span className="text-sky-400">Ahead</span>
                </span>
                <p className="text-[11px] text-slate-400 font-medium">Sri Lanka Vector Surveillance System</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              An evidence-driven epidemiological early-warning platform engineered for Sri Lanka's 25 administrative districts. Integrates weekly national surveillance with ERA5 climate physics to deliver honest, calibrated hotspot forecasts.
            </p>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>NDCU Surveillance Sync: Active (LK-11 to LK-92)</span>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1">
              <div>Team EchoBinary &bull; ModelX 2.0 Competition</div>
              <div>Non-Clinical Public Health Decision Support System</div>
            </div>
          </div>

          {/* Col 2: Machine Learning Intelligence (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white">Machine Learning</p>
            <ul className="space-y-2 text-xs p-0 m-0 list-none">
              <li>
                <button onClick={() => navigate('/app/model')} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-left text-slate-400">
                  HistGradientBoosting
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/methodology')} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-left text-slate-400">
                  Platt Calibration
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/methodology')} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-left text-slate-400">
                  Conformal Bounds (80%)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/app/model')} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-left text-slate-400">
                  Confusion Matrix
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/methodology')} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-left text-slate-400">
                  Strict As-Of Cutoffs
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Surveillance & Data (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white">Data Infrastructure</p>
            <ul className="space-y-2 text-xs p-0 m-0 list-none">
              <li>
                <button onClick={() => navigate('/app/data-quality')} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-left text-slate-400">
                  NDCU Surveillance Tables
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/app/data-quality')} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-left text-slate-400">
                  Open-Meteo ERA5 Reanalysis
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/app/data-quality')} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-left text-slate-400">
                  SHA-256 Provenance
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/app/data-quality')} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-left text-slate-400">
                  Quarantine Pipeline
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/app/compare')} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-left text-slate-400">
                  District Comparator
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform & Legal (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white">Platform &amp; Legal</p>
            <ul className="space-y-2 text-xs p-0 m-0 list-none">
              <li>
                <button onClick={() => navigate('/app/overview')} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-left flex items-center gap-1.5 text-slate-400">
                  <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                  Overview Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/app/map')} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-left flex items-center gap-1.5 text-slate-400">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  Interactive Map
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/about')} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-left flex items-center gap-1.5 text-slate-400">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Technical Report &amp; Team
                </button>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-slate-400 no-underline"
                >
                  <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                  GitHub Source Repository
                  <ExternalLink className="w-3 h-3 ml-0.5 text-slate-500" />
                </a>
              </li>
              <li>
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  MIT Open Source License
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Institutional Citation Strip */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <strong>NDCU:</strong> Ministry of Health Sri Lanka Weekly Bulletins
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              <strong>Open-Meteo:</strong> ERA5 Reanalysis Weather (CC BY 4.0)
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <strong>ModelX 2.0:</strong> EchoBinary Research Submission
            </span>
          </div>
          <div className="font-mono text-[10px] text-slate-500">
            BUILD: v2.0.0-freeze &bull; 25 DISTRICTS
          </div>
        </div>

        {/* Bottom Legal Copyright Line */}
        <div className="pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p className="m-0">
            &copy; 2026 EchoBinary. Released under the MIT License. Non-clinical public health intelligence system.
          </p>
          <div className="flex items-center gap-6 text-[11px]">
            <button onClick={() => navigate('/methodology')} className="hover:text-slate-300 bg-transparent border-none p-0 cursor-pointer text-slate-500">
              Methodology
            </button>
            <button onClick={() => navigate('/app/data-quality')} className="hover:text-slate-300 bg-transparent border-none p-0 cursor-pointer text-slate-500">
              Data Provenance
            </button>
            <button onClick={() => navigate('/about')} className="hover:text-slate-300 bg-transparent border-none p-0 cursor-pointer text-slate-500">
              AI Disclosure
            </button>
            <button onClick={() => navigate('/about')} className="hover:text-slate-300 bg-transparent border-none p-0 cursor-pointer text-slate-500">
              Non-Clinical Disclaimer
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

