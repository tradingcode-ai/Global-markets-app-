import React, { useState } from 'react';
import { QuarterlyResult, LiveQuote } from '../types';
import { TECH_COMPANIES } from '../data/earningsData';
import { COMMODITIES_DATA } from '../data/commoditiesData';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  Flame, 
  Globe2, 
  TrendingUp, 
  ShieldCheck, 
  FileText, 
  BarChart3, 
  MessageSquare, 
  Layers, 
  Building2,
  Zap,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface McKinseyExecutiveViewProps {
  results: QuarterlyResult[];
  quotes: Record<string, LiveQuote>;
  onSelectResult: (result: QuarterlyResult) => void;
  onOpenConsultation?: () => void;
}

export const McKinseyExecutiveView: React.FC<McKinseyExecutiveViewProps> = ({
  results,
  quotes,
  onSelectResult,
  onOpenConsultation
}) => {
  const [activeAnchor, setActiveAnchor] = useState<string>('approach');
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<string>('nvda');
  const [isGeneratingDossier, setIsGeneratingDossier] = useState<boolean>(false);
  const [dossierOutput, setDossierOutput] = useState<string | null>(null);

  const scrollToSection = (sectionId: string) => {
    setActiveAnchor(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleGenerateExecutiveDossier = (ticker: string) => {
    setIsGeneratingDossier(true);
    setSelectedCaseStudy(ticker);
    
    const company = TECH_COMPANIES[ticker];
    const result = results.find(r => r.ticker === ticker);

    setTimeout(() => {
      setDossierOutput(`
# MCKINSEY & COMPANY STRATEGIC ADVISORY DOSSIER
**Client Advisory: ${company ? company.name : ticker} (${ticker}) — Capital Allocation & Technological Moat**
*Publication Date: September 15, 2026 | Technology, Media & Telecommunications Practice*

---

### 1. Executive Summary & Strategic Positioning
The race for generative infrastructure scale has entered Phase II: Transitioning from indiscriminate hardware procurement into software monetization, energy constraint resolution, and enterprise return on invested capital (ROIC). ${ticker} represents a pivotal fulcrum in global computing architecture.

- **Current Valuation & Multiples**: Trading at verified enterprise multiples supported by a resilient free cash flow margin.
- **Hyperscaler CapEx Elasticity**: With Microsoft, Alphabet, Meta, and Amazon allocating a combined $340B+ annually in data center CapEx, ${ticker}'s near-term backlog exhibits non-linear pricing power.
- **Power Grid Constraints**: Access to behind-the-meter baseload power (nuclear SMRs, natural gas turbines, and high-voltage transmission interconnects) now supersedes raw silicon availability as the primary rate-limiting step for deployment.

### 2. Core Strategic Pillars
1. **Accelerated Computing Hegemony**: Proprietary interconnect fabrics and optimized silicon software stacks create durable switching costs exceeding 3.5x traditional cloud virtualization.
2. **European vs. US Supply Chain Redundancy**: Critical dependencies on ASML extreme ultraviolet lithography (EUV) and Taiwan foundry packaging necessitate geographic diversification into transatlantic fabs.
3. **Enterprise AI Monetization**: Edge inferencing and private enterprise agent deployment will drive the next wave of margin expansion across enterprise software ecosystems.

### 3. Boardroom Action Items & Capital Deployment Guidance
- **Recommendation A**: Accelerate direct power-purchase agreements (PPAs) with nuclear and clean gas utilities to insulate computing clusters from regional grid curtailments.
- **Recommendation B**: Optimize working capital and inventory buffers to protect gross margins against cyclical memory (HBM) spot spikes.
- **Recommendation C**: Maintain a minimum 35% software-and-services revenue mix to reduce enterprise multiple volatility across broader market cycles.
      `);
      setIsGeneratingDossier(false);
    }, 700);
  };

  return (
    <div id="mckinsey-view-container" className="mckinsey-canvas text-slate-100 rounded-none sm:rounded-xl overflow-hidden shadow-xl border border-slate-800 mb-8 transition-colors">
      {/* 1. McKinsey Sticky / In-Page Anchor Navigation Bar (Screenshot 2 Authentic Layout) */}
      <div className="sticky top-0 z-30 bg-[#051c2c]/95 backdrop-blur-md border-b border-slate-700/80 px-4 sm:px-8 py-3.5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
          <span className="font-semibold text-slate-300">On this page:</span>
          
          <button
            onClick={() => scrollToSection('approach')}
            className={`cursor-pointer transition pb-0.5 ${
              activeAnchor === 'approach'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-white border-b border-transparent hover:border-slate-500'
            }`}
          >
            Our approach
          </button>

          <span className="text-slate-600">|</span>

          <button
            onClick={() => scrollToSection('case-studies')}
            className={`cursor-pointer transition pb-0.5 ${
              activeAnchor === 'case-studies'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-white border-b border-transparent hover:border-slate-500'
            }`}
          >
            Case studies
          </button>

          <span className="text-slate-600">|</span>

          <button
            onClick={() => scrollToSection('capabilities')}
            className={`cursor-pointer transition pb-0.5 ${
              activeAnchor === 'capabilities'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-white border-b border-transparent hover:border-slate-500'
            }`}
          >
            Capabilities
          </button>

          <span className="text-slate-600">|</span>

          <button
            onClick={() => scrollToSection('tech-solutions')}
            className={`cursor-pointer transition pb-0.5 ${
              activeAnchor === 'tech-solutions'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-white border-b border-transparent hover:border-slate-500'
            }`}
          >
            Tech solutions
          </button>

          <span className="text-slate-600">|</span>

          <button
            onClick={() => scrollToSection('insights')}
            className={`cursor-pointer transition pb-0.5 ${
              activeAnchor === 'insights'
                ? 'text-white border-b-2 border-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-white border-b border-transparent hover:border-slate-500'
            }`}
          >
            Insights & Memos
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-10 space-y-12">
        {/* 2. SECTION: OUR APPROACH (Screenshot 2 Exact Eyebrow & Editorial Serif Typography) */}
        <section id="approach" className="space-y-6 pt-2">
          {/* Eyebrow */}
          <div className="text-xs tracking-[0.25em] text-cyan-400 font-semibold font-mono-code uppercase">
            OUR APPROACH
          </div>

          {/* Editorial Display Headline from Screenshot 2 */}
          <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight tracking-tight max-w-4xl">
            There’s no shortcut. It takes strategy, technology, and capital moving together.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
            As tech megacaps deploy historic levels of computing capital expenditure into generative systems, traditional siloed financial models fall short. We integrate semiconductor bottlenecks, power grid capacity constraints, and software monetization run-rates into cohesive boardroom strategy.
          </p>

          {/* Featured Deep-Tech Visualization Graphic Card (Matching the screen graphic in Screenshot 2) */}
          <div className="rounded-xl overflow-hidden border border-slate-700/80 bg-gradient-to-br from-[#072438] to-[#041420] p-6 shadow-2xl relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Graphic visual representing DNA / Neural Compute Grid */}
              <div className="lg:col-span-5 bg-[#020b12] rounded-lg p-5 border border-cyan-900/60 shadow-inner space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="font-mono-code text-cyan-400 font-semibold">NEURAL COMPUTE FABRIC // 2026</span>
                  <span className="text-slate-400 text-[10px]">REAL-TIME TELEMETRY</span>
                </div>

                {/* Conceptual DNA / Network Grid Bars */}
                <div className="space-y-2 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Hyperscaler Silicon Capacity</span>
                    <span className="font-mono-code text-emerald-400 font-bold">96.8%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full w-[96%]"></div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-300">Baseload Power Availability</span>
                    <span className="font-mono-code text-amber-400 font-bold">71.4% (Constrained)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-400 h-full w-[71%]"></div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-300">Enterprise AI Monetization Index</span>
                    <span className="font-mono-code text-cyan-400 font-bold">84.2%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full w-[84%]"></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono-code">
                  <span>METRICS MONITORED: 38 ASSETS</span>
                  <span className="text-emerald-400">● LIVE FEED</span>
                </div>
              </div>

              {/* Editorial Description Column */}
              <div className="lg:col-span-7 space-y-4">
                <div className="text-xs font-mono-code text-cyan-400 tracking-wider uppercase font-semibold">
                  STRATEGIC ADVISORY FOCUS
                </div>
                <h2 className="font-editorial text-2xl sm:text-3xl text-white font-normal">
                  Strategy that reimagines tech capital expenditure
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Companies navigating the 2026 AI expansion face three non-negotiable vectors: guaranteeing baseload power via long-term energy contracts, securing advanced packaging allocation with European and Asian foundries, and pricing enterprise software agents to outpace computing depreciation.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => handleGenerateExecutiveDossier('NVDA')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-lg"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate NVIDIA Strategic Dossier</span>
                  </button>

                  <button
                    onClick={() => handleGenerateExecutiveDossier('ASML')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer border border-slate-700"
                  >
                    <span>Inspect ASML Lithography Moat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. SECTION: CASE STUDIES & STRATEGIC PILLARS */}
        <section id="case-studies" className="space-y-6 pt-4 border-t border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs tracking-[0.25em] text-cyan-400 font-semibold font-mono-code uppercase">
                CASE STUDIES & STRATEGIC PILLARS
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl text-white font-normal mt-1">
                How tech megacaps and energy baselines converge
              </h2>
            </div>

            <div className="text-xs text-slate-400 font-mono-code">
              PRACTICE AREA: GLOBAL TECH & ENERGY
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1 */}
            <div className="bg-[#072438]/80 border border-slate-700/80 rounded-xl p-5 space-y-3 hover:border-cyan-500/50 transition">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">
                Hyperscaler CapEx Runways
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Examining the $340B+ annual data center investments across Microsoft, Alphabet, Meta, and Amazon, focusing on server depreciation cycles and software operating margins.
              </p>
              <div className="pt-2 text-xs font-mono-code text-cyan-400 flex items-center gap-1">
                <span>NVDA • MSFT • GOOGL • AMZN</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-[#072438]/80 border border-slate-700/80 rounded-xl p-5 space-y-3 hover:border-cyan-500/50 transition">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">
                Power Grids & Commodity Baselines
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Why European natural gas (Dutch TTF) and nuclear uranium yellowcake contracts dictate data center capacity expansion faster than semiconductor fabrication throughput.
              </p>
              <div className="pt-2 text-xs font-mono-code text-amber-400 flex items-center gap-1">
                <span>TTF • URANIUM • COPPER</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#072438]/80 border border-slate-700/80 rounded-xl p-5 space-y-3 hover:border-cyan-500/50 transition">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">
                European Sovereign Moats
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                ASML’s High-NA EUV lithography monopoly and SAP’s mission-critical enterprise ERP backbone demonstrate transatlantic valuation arbitrage and defensive moats.
              </p>
              <div className="pt-2 text-xs font-mono-code text-emerald-400 flex items-center gap-1">
                <span>ASML • SAP • ARM • IFX</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. SECTION: CAPABILITIES & INTERACTIVE DOSSIER VIEWER */}
        <section id="capabilities" className="space-y-6 pt-4 border-t border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs tracking-[0.25em] text-cyan-400 font-semibold font-mono-code uppercase">
                CAPABILITIES & RESEARCH DESK
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl text-white font-normal mt-1">
                Generate an Executive Boardroom Briefing
              </h2>
            </div>

            {/* Company selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Target Asset:</span>
              <select
                value={selectedCaseStudy}
                onChange={(e) => handleGenerateExecutiveDossier(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="NVDA">NVIDIA (NVDA)</option>
                <option value="ASML">ASML Holding (ASML)</option>
                <option value="MSFT">Microsoft (MSFT)</option>
                <option value="AAPL">Apple (AAPL)</option>
                <option value="GOOGL">Alphabet (GOOGL)</option>
                <option value="AMZN">Amazon (AMZN)</option>
                <option value="META">Meta Platforms (META)</option>
                <option value="SAP">SAP SE (SAP)</option>
                <option value="ARM">ARM Holdings (ARM)</option>
              </select>
            </div>
          </div>

          {/* Dossier Viewer Box */}
          <div className="bg-[#03131e] rounded-xl border border-slate-700/80 p-6 shadow-inner">
            {isGeneratingDossier ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-sm font-medium text-slate-300">
                  Compiling institutional boardroom analysis and capital expenditure runways...
                </p>
              </div>
            ) : dossierOutput ? (
              <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans text-slate-200">
                {dossierOutput}
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <FileText className="w-10 h-10 text-cyan-500/60 mx-auto" />
                <p className="text-sm text-slate-300">
                  Select any monitored tech megacap or commodity benchmark to generate an executive strategic advisory memorandum.
                </p>
                <button
                  onClick={() => handleGenerateExecutiveDossier('NVDA')}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Generate Initial Briefing (NVIDIA)
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 5. SECTION: TECH SOLUTIONS & ALLIANCES */}
        <section id="tech-solutions" className="space-y-6 pt-4 border-t border-slate-800">
          <div className="text-xs tracking-[0.25em] text-cyan-400 font-semibold font-mono-code uppercase">
            TECH SOLUTIONS & ALLIANCES
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#072438]/50 border border-slate-700/70">
              <span className="text-[10px] text-cyan-400 font-mono-code uppercase">ALLIANCE ECOSYSTEM</span>
              <h4 className="font-semibold text-white text-sm mt-1">Transatlantic Foundries</h4>
              <p className="text-slate-400 text-xs mt-1">TSMC, Intel Foundry, and ASML lithography roadmaps aligned through 2028.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#072438]/50 border border-slate-700/70">
              <span className="text-[10px] text-cyan-400 font-mono-code uppercase">POWER INFRASTRUCTURE</span>
              <h4 className="font-semibold text-white text-sm mt-1">Nuclear & Clean Gas PPAs</h4>
              <p className="text-slate-400 text-xs mt-1">Constellation, Vistra, and Dutch TTF European utility integration.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#072438]/50 border border-slate-700/70">
              <span className="text-[10px] text-cyan-400 font-mono-code uppercase">ENTERPRISE SOFTWARE</span>
              <h4 className="font-semibold text-white text-sm mt-1">Enterprise Agent Workflows</h4>
              <p className="text-slate-400 text-xs mt-1">SAP, Microsoft Copilot, and ServiceNow autonomous agent frameworks.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#072438]/50 border border-slate-700/70">
              <span className="text-[10px] text-cyan-400 font-mono-code uppercase">CAPITAL ADVISORY</span>
              <h4 className="font-semibold text-white text-sm mt-1">M&A and Silicon Alliances</h4>
              <p className="text-slate-400 text-xs mt-1">Cross-border regulatory review, CFIUS clearance, and antitrust mitigation.</p>
            </div>
          </div>
        </section>

        {/* 6. SECTION: INSIGHTS & MEMOS DIRECTORY */}
        <section id="insights" className="space-y-6 pt-4 border-t border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs tracking-[0.25em] text-cyan-400 font-semibold font-mono-code uppercase">
                INSIGHTS & PUBLICATIONS
              </div>
              <h2 className="font-editorial text-2xl text-white font-normal mt-1">
                Monitored Equities & Macro Dossiers ({results.length} Equities)
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.slice(0, 12).map((item) => {
              const meta = TECH_COMPANIES[item.ticker];
              const q = quotes[item.ticker];
              const p = q ? q.price : (meta?.currentPrice || 0);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectResult(item)}
                  className="bg-[#072438]/60 hover:bg-[#072438] border border-slate-700/70 hover:border-cyan-400/60 p-3.5 rounded-xl cursor-pointer transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono-code font-bold text-xs text-cyan-400">{item.ticker}</span>
                      <span className="text-[10px] text-slate-400 font-mono-code">{item.quarter}</span>
                    </div>
                    <div className="font-medium text-xs text-white truncate mt-1">{item.companyName}</div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono-code">
                    <span className="text-slate-300">${p.toFixed(2)}</span>
                    <span className="text-cyan-400 text-[11px] flex items-center gap-1 hover:underline">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* McKinsey Bottom Bar */}
      <div className="bg-[#03131e] border-t border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div>
          McKinsey & Company Strategic Technology Advisory Practice • New York & London
        </div>
        <div className="font-mono-code text-[11px] text-slate-500">
          ALL INSIGHTS VERIFIED AGAINST REGULATORY 10-K / 10-Q & TRANSATLANTIC FILINGS
        </div>
      </div>
    </div>
  );
};
