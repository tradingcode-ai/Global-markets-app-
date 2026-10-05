import { BRAND_ICONS, OFFICIAL_DOMAINS, OFFICIAL_FAVICON_FIRST, SIMPLE_ICONS_VERSION } from './StockLogo';

export const getLoadingAsset = (ticker: string) => {
  const cleanTicker = ticker ? ticker.toUpperCase().trim() : '';
  const slug = BRAND_ICONS[cleanTicker];
  const domain = OFFICIAL_DOMAINS[cleanTicker];
  
  // Explicit overrides for SVGs that were removed from Simple Icons (DMCA/Trademark)
  // or that simply aren't in the tech-focused database.
  const overrides: Record<string, string> = {
    'AMZN': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    'MSFT': 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
    'ORCL': 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg',
    'CRM': 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg',
    'ASML': 'https://upload.wikimedia.org/wikipedia/commons/2/22/ASML_Holding_N.V._logo.svg',
    'TSM': 'https://upload.wikimedia.org/wikipedia/commons/3/36/TSMC_logo.svg',
    'TXN': 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Texas_Instruments_logo.svg',
    'MU': 'https://upload.wikimedia.org/wikipedia/commons/1/18/Micron_Technology_logo.svg',
    'WDC': 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Western_Digital_logo.svg',
    'KKR': 'https://upload.wikimedia.org/wikipedia/commons/5/5e/KKR_logo.svg',
    'BX': 'https://upload.wikimedia.org/wikipedia/commons/4/46/Blackstone_Group_logo.svg',
    'MS': 'https://upload.wikimedia.org/wikipedia/commons/3/34/Morgan_Stanley_Logo_1.svg',
    'C': 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Citigroup_logo.svg',
    'JPM': 'https://upload.wikimedia.org/wikipedia/commons/0/09/JPMorgan_Chase_Logo.svg'
  };

  if (overrides[cleanTicker]) {
    return { src: overrides[cleanTicker], type: 'svg' as const };
  }

  // If there's a valid Simple Icons slug, use it as SVG
  if (slug) {
    return { 
      src: `https://cdn.jsdelivr.net/npm/simple-icons@${SIMPLE_ICONS_VERSION}/icons/${slug}.svg`, 
      type: 'svg' as const 
    };
  }

  // Fallback to highest-quality raster if no SVG available
  if (domain) {
    return { 
      src: `https://icon.horse/icon/${domain}`, 
      type: 'raster' as const 
    };
  }

  return null;
};
