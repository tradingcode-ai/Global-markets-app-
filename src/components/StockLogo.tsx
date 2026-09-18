import React from 'react';

interface StockLogoProps {
  ticker: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const StockLogo: React.FC<StockLogoProps> = ({ 
  ticker, 
  size = 'sm',  
  className = '' 
}) => {
  const cleanTicker = ticker.toUpperCase().trim();

  // Size mapping
  const sizeMap = {
    xs: 'w-3.5 h-3.5 text-[8px]',
    sm: 'w-5 h-5 text-[9px]',
    md: 'w-6 h-6 text-[10px]',
    lg: 'w-8 h-8 text-xs'
  };

  const currentSizeClass = sizeMap[size];

  // Render official vector SVG logos for each company
  switch (cleanTicker) {
    case 'NVDA':
      return (
        <div className={`${currentSizeClass} rounded bg-[#76B900] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="NVIDIA">
          <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 fill-white">
            <path d="M7.74 8.71c.97-1.14 2.45-1.84 4.09-1.84 3.09 0 5.6 2.51 5.6 5.6 0 1.25-.42 2.4-1.12 3.33l2.08 2.08c1.69-1.48 2.77-3.66 2.77-6.08 0-4.42-3.58-8-8-8-2.67 0-5.04 1.3-6.49 3.32l1.07 1.59zm-2.03 2.15l-1.6-1.07C2.92 11.23 2.25 12.8 2.25 14.5c0 4.42 3.58 8 8 8 3.1 0 5.79-1.76 7.13-4.34l-1.92-1.28c-.89 1.71-2.69 2.89-4.78 2.89-2.96 0-5.38-2.3-5.58-5.21l6.76-4.51-1.11-1.65-4.99 3.46z" />
          </svg>
        </div>
      );

    case 'MSFT':
      return (
        <div className={`${currentSizeClass} rounded bg-[#1f2937] p-0.5 flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Microsoft">
          <div className="grid grid-cols-2 gap-0.5 w-full h-full p-0.5">
            <div className="bg-[#F25022] rounded-[1px]" />
            <div className="bg-[#7FBA00] rounded-[1px]" />
            <div className="bg-[#00A4EF] rounded-[1px]" />
            <div className="bg-[#FFB900] rounded-[1px]" />
          </div>
        </div>
      );

    case 'AAPL':
      return (
        <div className={`${currentSizeClass} rounded bg-slate-900 flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Apple">
          <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 fill-white">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.68-.83 1.14-1.99 1.01-3.15-1 .04-2.17.67-2.88 1.5-.63.73-1.19 1.9-1.04 3.03 1.12.09 2.23-.55 2.91-1.38z" />
          </svg>
        </div>
      );

    case 'GOOGL':
    case 'GOOG':
      return (
        <div className={`${currentSizeClass} rounded bg-white p-0.5 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs ${className}`} title="Google">
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.25 21.36 7.33 24 12 24z" />
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
          </svg>
        </div>
      );

    case 'AMZN':
      return (
        <div className={`${currentSizeClass} rounded bg-[#131921] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Amazon">
          <span className="font-bold text-[#FF9900] tracking-tighter">a</span>
        </div>
      );

    case 'META':
      return (
        <div className={`${currentSizeClass} rounded bg-[#0668E1] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Meta">
          <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 fill-white">
            <path d="M12 4.5C7.2 4.5 3.6 7.8 2.2 12c1.4 4.2 5 7.5 9.8 7.5s8.4-3.3 9.8-7.5C20.4 7.8 16.8 4.5 12 4.5zm0 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" />
          </svg>
        </div>
      );

    case 'TSM':
      return (
        <div className={`${currentSizeClass} rounded bg-[#C00000] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="TSMC">
          <span className="text-[9px] font-black text-white tracking-tighter">TSM</span>
        </div>
      );

    case 'AVGO':
      return (
        <div className={`${currentSizeClass} rounded bg-[#CC092F] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Broadcom">
          <span className="text-[8px] font-black text-white tracking-tighter">AVGO</span>
        </div>
      );

    case 'ORCL':
      return (
        <div className={`${currentSizeClass} rounded bg-[#C74634] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Oracle">
          <span className="text-[8px] font-black text-white tracking-tighter">ORCL</span>
        </div>
      );

    case 'AMD':
      return (
        <div className={`${currentSizeClass} rounded bg-[#007D40] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="AMD">
          <span className="text-[9px] font-black text-white tracking-tighter">AMD</span>
        </div>
      );

    case 'CRM':
      return (
        <div className={`${currentSizeClass} rounded bg-[#00A1E0] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Salesforce">
          <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 fill-white">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>
        </div>
      );

    case 'NFLX':
      return (
        <div className={`${currentSizeClass} rounded bg-black flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Netflix">
          <span className="text-[11px] font-black text-[#E50914] tracking-tighter">N</span>
        </div>
      );

    // European Megacaps
    case 'ASML':
      return (
        <div className={`${currentSizeClass} rounded bg-[#002776] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="ASML">
          <span className="text-[8px] font-black text-[#00A3E0] tracking-tighter">ASML</span>
        </div>
      );

    case 'SAP':
      return (
        <div className={`${currentSizeClass} rounded bg-[#008FD3] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="SAP">
          <span className="text-[9px] font-black text-white tracking-tighter">SAP</span>
        </div>
      );

    case 'ARM':
      return (
        <div className={`${currentSizeClass} rounded bg-[#0091BD] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Arm Holdings">
          <span className="text-[9px] font-black text-white tracking-tighter">arm</span>
        </div>
      );

    case 'SPOT':
      return (
        <div className={`${currentSizeClass} rounded bg-[#1ED760] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Spotify">
          <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 fill-black">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </div>
      );

    case 'STM':
      return (
        <div className={`${currentSizeClass} rounded bg-[#03234B] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="STMicroelectronics">
          <span className="text-[8px] font-black text-[#FFD200] tracking-tighter">ST</span>
        </div>
      );

    case 'PRX':
      return (
        <div className={`${currentSizeClass} rounded bg-[#001428] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Prosus">
          <span className="text-[8px] font-black text-[#F8B700] tracking-tighter">PRX</span>
        </div>
      );

    case 'ADYEN':
      return (
        <div className={`${currentSizeClass} rounded bg-[#00112C] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Adyen">
          <span className="text-[8px] font-black text-[#0ABF53] tracking-tighter">ady</span>
        </div>
      );

    case 'IFX':
      return (
        <div className={`${currentSizeClass} rounded bg-[#0A8276] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Infineon">
          <span className="text-[8px] font-black text-white tracking-tighter">IFX</span>
        </div>
      );

    case 'SU':
      return (
        <div className={`${currentSizeClass} rounded bg-[#3DCD58] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Schneider Electric">
          <span className="text-[9px] font-black text-white tracking-tighter">SE</span>
        </div>
      );

    case 'SIE':
      return (
        <div className={`${currentSizeClass} rounded bg-[#00646E] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Siemens">
          <span className="text-[8px] font-black text-[#EB780A] tracking-tighter">SIE</span>
        </div>
      );

    // ==========================================
    // U.S. BIG 6 BANKS
    // ==========================================
    case 'JPM':
      return (
        <div className={`${currentSizeClass} rounded bg-[#002D62] flex items-center justify-center shrink-0 shadow-2xs p-0.5 ${className}`} title="JPMorgan Chase & Co.">
          <svg viewBox="0 0 24 24" className="w-4/5 h-4/5 fill-white">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.8l7.5 3.75v7.9L12 20.2l-7.5-3.75v-7.9L12 4.8zm-1 3.2v8h2V8h-2z" />
          </svg>
        </div>
      );

    case 'BAC':
      return (
        <div className={`${currentSizeClass} rounded bg-[#002B49] flex items-center justify-center shrink-0 shadow-2xs p-0.5 overflow-hidden ${className}`} title="Bank of America">
          <div className="flex flex-col gap-0.5 w-3/4">
            <div className="h-0.5 bg-[#E31837] rounded-[0.5px]" />
            <div className="h-0.5 bg-white rounded-[0.5px]" />
            <div className="h-0.5 bg-[#E31837] rounded-[0.5px]" />
            <div className="h-0.5 bg-[#00529B] rounded-[0.5px]" />
          </div>
        </div>
      );

    case 'C':
      return (
        <div className={`${currentSizeClass} rounded bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs relative p-0.5 ${className}`} title="Citigroup">
          <div className="relative flex items-center justify-center">
            <span className="text-[9px] font-bold text-[#003B70] tracking-tighter">citi</span>
            <div className="absolute -top-1 w-3.5 h-1 border-t-2 border-[#ED1B24] rounded-t-full" />
          </div>
        </div>
      );

    case 'WFC':
      return (
        <div className={`${currentSizeClass} rounded bg-[#D71E28] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Wells Fargo">
          <span className="text-[8px] font-black text-[#FFD200] tracking-tighter">WFC</span>
        </div>
      );

    case 'MS':
      return (
        <div className={`${currentSizeClass} rounded bg-[#002B49] flex items-center justify-center shrink-0 shadow-2xs p-0.5 ${className}`} title="Morgan Stanley">
          <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 fill-white">
            <path d="M4 19h16V5H4v14zm2-12h12v10H6V7zm2 2v6h2V9H8zm4 0v6h2V9h-2zm4 0v6h2V9h-2z" />
          </svg>
        </div>
      );

    case 'GS':
      return (
        <div className={`${currentSizeClass} rounded bg-[#7399C6] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="Goldman Sachs">
          <span className="text-[9px] font-black text-white font-serif tracking-tight">GS</span>
        </div>
      );

    // ==========================================
    // U.S. ALTERNATIVE ASSET MANAGERS
    // ==========================================
    case 'BX':
      return (
        <div className={`${currentSizeClass} rounded bg-black flex items-center justify-center shrink-0 shadow-2xs border border-zinc-700 ${className}`} title="Blackstone">
          <span className="text-[10px] font-black text-white font-serif tracking-tighter">B</span>
        </div>
      );

    case 'KKR':
      return (
        <div className={`${currentSizeClass} rounded bg-[#0C2340] flex items-center justify-center shrink-0 shadow-2xs border border-blue-900 ${className}`} title="KKR">
          <span className="text-[8px] font-black text-[#D4AF37] tracking-tighter">KKR</span>
        </div>
      );

    case 'APO':
      return (
        <div className={`${currentSizeClass} rounded bg-[#002244] flex items-center justify-center shrink-0 shadow-2xs border border-amber-900/40 ${className}`} title="Apollo Global Management">
          <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 fill-[#D4AF37]">
            <path d="M12 2L4 20h3.5l1.8-4.5h5.4L16.5 20H20L12 2zm0 6l1.8 4.5h-3.6L12 8z" />
          </svg>
        </div>
      );

    case 'ARES':
      return (
        <div className={`${currentSizeClass} rounded bg-[#1C2541] flex items-center justify-center shrink-0 shadow-2xs border border-slate-700 ${className}`} title="Ares Management">
          <span className="text-[8px] font-black text-cyan-400 tracking-tighter">ARES</span>
        </div>
      );

    // ==========================================
    // EUROPEAN FINANCIALS
    // ==========================================
    case 'BCS':
    case 'BARC':
      return (
        <div className={`${currentSizeClass} rounded bg-[#002B49] flex items-center justify-center shrink-0 shadow-2xs p-0.5 ${className}`} title="Barclays">
          <svg viewBox="0 0 24 24" className="w-4/5 h-4/5 fill-[#00AEEF]">
            <path d="M12 3L4 7v6c0 5 3.5 9.5 8 10.5 4.5-1 8-5.5 8-10.5V7l-8-4zm0 3l5 2.5v4c0 3.5-2.2 6.8-5 7.8-2.8-1-5-4.3-5-7.8v-4L12 6z" />
          </svg>
        </div>
      );

    case 'HSBC':
      return (
        <div className={`${currentSizeClass} rounded bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs p-0.5 ${className}`} title="HSBC">
          <div className="w-3/4 h-3/4 relative flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-[#DB0011] transform rotate-45" />
            <div className="absolute left-0 w-1.5 h-1.5 bg-[#DB0011]" />
            <div className="absolute right-0 w-1.5 h-1.5 bg-[#DB0011]" />
          </div>
        </div>
      );

    case 'ABN':
      return (
        <div className={`${currentSizeClass} rounded bg-[#008375] flex items-center justify-center shrink-0 shadow-2xs p-0.5 ${className}`} title="ABN AMRO">
          <svg viewBox="0 0 24 24" className="w-3/4 h-3/4">
            <path fill="#FFAE00" d="M12 2L4 7v10l8 5 8-5V7l-8-5zm4 11l-4 4-4-4 2-2 2 2 2-2 2 2z" />
          </svg>
        </div>
      );

    case 'ING':
      return (
        <div className={`${currentSizeClass} rounded bg-[#FF6200] flex items-center justify-center shrink-0 shadow-2xs p-0.5 ${className}`} title="ING">
          <span className="text-[9px] font-black text-white tracking-tighter">ING</span>
        </div>
      );

    case 'RABO':
      return (
        <div className={`${currentSizeClass} rounded bg-[#001D4A] flex items-center justify-center shrink-0 shadow-2xs p-0.5 ${className}`} title="Rabobank">
          <svg viewBox="0 0 24 24" className="w-3/4 h-3/4">
            <circle cx="12" cy="7" r="3.5" fill="#FF6600" />
            <path d="M6 18c0-3.3 2.7-6 6-6s6 2.7 6 6v2H6v-2z" fill="#FF6600" />
          </svg>
        </div>
      );

    case 'BNP':
      return (
        <div className={`${currentSizeClass} rounded bg-[#00915A] flex items-center justify-center shrink-0 shadow-2xs p-0.5 ${className}`} title="BNP Paribas">
          <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 fill-white">
            <path d="M12 2l1.5 4.5h4.8l-3.9 2.8 1.5 4.5-3.9-2.8-3.9 2.8 1.5-4.5-3.9-2.8h4.8z" />
            <circle cx="5" cy="18" r="1.5" />
            <circle cx="12" cy="18" r="1.5" />
            <circle cx="19" cy="18" r="1.5" />
          </svg>
        </div>
      );

    case 'GLE':
      return (
        <div className={`${currentSizeClass} rounded bg-white border border-slate-200 overflow-hidden flex flex-col items-center justify-center shrink-0 shadow-2xs ${className}`} title="Société Générale">
          <div className="w-full h-1/2 bg-[#E60028]" />
          <div className="w-full h-0.5 bg-white" />
          <div className="w-full h-1/2 bg-black" />
        </div>
      );

    case 'UBS':
      return (
        <div className={`${currentSizeClass} rounded bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs p-0.5 ${className}`} title="UBS">
          <div className="flex items-center gap-0.5">
            <span className="text-[9px] font-black text-[#E60000] tracking-tighter">UBS</span>
          </div>
        </div>
      );

    case 'SAN':
      return (
        <div className={`${currentSizeClass} rounded bg-[#EC0000] flex items-center justify-center shrink-0 shadow-2xs p-0.5 ${className}`} title="Banco Santander">
          <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 fill-white">
            <path d="M12 2C8 6 6 10 6 14c0 4 3 7 6 8s6-4 6-8c0-4-2-8-6-12zm0 15c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" />
          </svg>
        </div>
      );

    case 'BBVA':
      return (
        <div className={`${currentSizeClass} rounded bg-[#004481] flex items-center justify-center shrink-0 shadow-2xs ${className}`} title="BBVA">
          <span className="text-[8px] font-black text-white tracking-tight">BBVA</span>
        </div>
      );

    case 'SX7P':
      return (
        <div className={`${currentSizeClass} rounded bg-[#002D62] flex items-center justify-center shrink-0 shadow-2xs border border-sky-400/40 p-0.5 ${className}`} title="STOXX Europe 600 Banks Index">
          <div className="flex flex-col items-center justify-center leading-none">
            <span className="text-[7px] font-black text-sky-300 tracking-tighter">SX7P</span>
            <span className="text-[6px] font-bold text-amber-300 tracking-tighter">600</span>
          </div>
        </div>
      );

    default:
      return (
        <div className={`${currentSizeClass} rounded bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 font-bold ${className}`}>
          {cleanTicker.slice(0, 2)}
        </div>
      );
  }
};
