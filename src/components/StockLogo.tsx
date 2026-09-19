import React, { useMemo, useState, useEffect } from 'react';

interface StockLogoProps {
  ticker: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Stock/company marks are loaded from a maintained brand-logo source instead of
 * hand-drawn SVGs. This keeps the marks consistent with the real brands and
 * avoids AI-generated approximations.
 *
 * Simple Icons provides the vector SVG brand marks; for companies that aren't in that
 * catalogue we fall back to the official high-resolution favicon of the company's own website.
 */
const BRAND_ICONS: Record<string, string> = {
  NVDA: 'nvidia',
  MSFT: 'microsoft',
  AAPL: 'apple',
  GOOGL: 'google',
  GOOG: 'google',
  AMZN: 'amazon',
  META: 'meta',
  TSM: 'tsmc',
  AVGO: 'broadcom',
  ORCL: 'oracle',
  AMD: 'amd',
  CRM: 'salesforce',
  NFLX: 'netflix',
  ASML: 'asml',
  SAP: 'sap',
  ARM: 'arm',
  SPOT: 'spotify',
  STM: 'stmicroelectronics',
  PRX: 'prosus',
  ADYEN: 'adyen',
  IFX: 'infineon',
  SU: 'schneiderelectric',
  SIE: 'siemens',

  // Banking & Financials vector icons available in Simple Icons
  JPM: 'chase',
  BAC: 'bankofamerica',
  WFC: 'wellsfargo',
  GS: 'goldmansachs',
  BCS: 'barclays',
  BARC: 'barclays',
  HSBC: 'hsbc',

  // The Shovel Sellers
  INTC: 'intel',
  MU: 'microntechnology',
  WDC: 'westerndigital',
  STX: 'seagate',
  DELL: 'dell',
  SMCI: 'supermicro',
  HPE: 'hewlettpackardenterprise',
  CSCO: 'cisco',
  SCSO: 'cisco',
  CIEN: 'ciena',
  AMAT: 'appliedmaterials',
  KLAC: 'kla',
  LRCX: 'lamresearch',
  TER: 'teradyne',
  TXN: 'texasinstruments',
  NXPI: 'nxp',
  SSNLF: 'samsung',
  '005930': 'samsung',
  HXSCF: 'skhynix',
  '000660': 'skhynix',
};

const OFFICIAL_DOMAINS: Record<string, string> = {
  NVDA: 'nvidia.com',
  MSFT: 'microsoft.com',
  AAPL: 'apple.com',
  GOOGL: 'google.com',
  GOOG: 'google.com',
  AMZN: 'amazon.com',
  META: 'meta.com',
  TSM: 'tsmc.com',
  AVGO: 'broadcom.com',
  ORCL: 'oracle.com',
  AMD: 'amd.com',
  CRM: 'salesforce.com',
  NFLX: 'netflix.com',
  ASML: 'asml.com',
  SAP: 'sap.com',
  ARM: 'arm.com',
  SPOT: 'spotify.com',
  STM: 'st.com',
  PRX: 'prosus.com',
  ADYEN: 'adyen.com',
  IFX: 'infineon.com',
  SU: 'se.com',
  SIE: 'siemens.com',

  JPM: 'jpmorganchase.com',
  BAC: 'bankofamerica.com',
  C: 'citigroup.com',
  WFC: 'wellsfargo.com',
  MS: 'morganstanley.com',
  GS: 'goldmansachs.com',
  BX: 'blackstone.com',
  KKR: 'kkr.com',
  APO: 'apollo.com',
  ARES: 'aresmgmt.com',
  BCS: 'barclays.com',
  BARC: 'barclays.com',
  HSBC: 'hsbc.com',
  ABN: 'abnamro.com',
  ING: 'ing.com',
  RABO: 'rabobank.com',
  BNP: 'group.bnpparibas',
  GLE: 'societegenerale.com',
  UBS: 'ubs.com',
  SAN: 'santander.com',
  BBVA: 'bbva.com',
  SX7P: 'stoxx.com',

  // The Shovel Sellers
  INTC: 'intel.com',
  MU: 'micron.com',
  MRVL: 'marvell.com',
  AMAT: 'appliedmaterials.com',
  LRCX: 'lamresearch.com',
  KLAC: 'kla.com',
  TER: 'teradyne.com',
  TOELY: 'tel.com',
  ATEYY: 'advantest.com',
  COHR: 'coherent.com',
  LITE: 'lumentum.com',
  CSCO: 'cisco.com',
  SCSO: 'cisco.com',
  CIEN: 'ciena.com',
  ASTS: 'ast-science.com',
  WDC: 'westerndigital.com',
  STX: 'seagate.com',
  DELL: 'dell.com',
  SMCI: 'supermicro.com',
  HPE: 'hpe.com',
  IONQ: 'ionq.com',
  QBTS: 'dwavesys.com',
  SSNLF: 'samsung.com',
  '005930': 'samsung.com',
  HXSCF: 'skhynix.com',
  '000660': 'skhynix.com',
  CXMT: 'cxmt.com',
  SMICY: 'smics.com',
  SMIC: 'smics.com',
  TXN: 'ti.com',
  KIOXIA: 'kioxia.com',
  NXPI: 'nxp.com',
  CBRS: 'cerebras.net',
};

const SIZE_MAP = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
} as const;

const SIMPLE_ICONS_VERSION = '16.31.0';

export const StockLogo: React.FC<StockLogoProps> = ({
  ticker,
  size = 'sm',
  className = '',
}) => {
  const cleanTicker = ticker.toUpperCase().trim();
  const [iconFailed, setIconFailed] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);

  // Reset failure state when ticker prop changes
  useEffect(() => {
    setIconFailed(false);
    setFaviconFailed(false);
  }, [cleanTicker]);

  const iconUrl = useMemo(() => {
    const slug = BRAND_ICONS[cleanTicker];
    return slug
      ? `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS_VERSION}/icons/${slug}.svg`
      : null;
  }, [cleanTicker]);

  const faviconUrl = useMemo(() => {
    const domain = OFFICIAL_DOMAINS[cleanTicker];
    return domain
      ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      : null;
  }, [cleanTicker]);

  // Determine current active source with resilient fallbacks
  let currentSrc: string | null = null;
  if (iconUrl && !iconFailed) {
    currentSrc = iconUrl;
  } else if (faviconUrl && !faviconFailed) {
    currentSrc = faviconUrl;
  }

  const handleImageError = () => {
    if (iconUrl && !iconFailed) {
      setIconFailed(true);
    } else {
      setFaviconFailed(true);
    }
  };

  const sizeClass = SIZE_MAP[size];

  if (!currentSrc) {
    return (
      <div
        className={`${sizeClass} rounded-md bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 font-bold text-[9px] ${className}`}
        title={cleanTicker}
        aria-label={cleanTicker}
      >
        {cleanTicker.slice(0, 2)}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-md bg-white border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs ${className}`}
      title={cleanTicker}
      aria-label={`${cleanTicker} logo`}
    >
      <img
        src={currentSrc}
        alt=""
        aria-hidden="true"
        className="w-[82%] h-[82%] object-contain"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={handleImageError}
      />
    </div>
  );
};
