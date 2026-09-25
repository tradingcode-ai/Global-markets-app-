import React, { useEffect } from 'react';
import { PushNotificationItem } from '../types';
import { 
  Bell, 
  X, 
  ChevronRight, 
  Award, 
  AlertCircle, 
  FileCheck2, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';
import MomentumIcon from './MomentumIcon';

interface LivePushToastProps {
  notification: PushNotificationItem | null;
  onDismiss: () => void;
  onViewDetails: (ticker: string) => void;
}

export const LivePushToast: React.FC<LivePushToastProps> = ({
  notification,
  onDismiss,
  onViewDetails
}) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const isUp = notification.type === 'momentum-up' || notification.type === 'earnings-beat' || notification.type === 'beat';
  const isDown = notification.type === 'momentum-down' || notification.type === 'earnings-miss' || notification.type === 'miss';
  const isSec8k = notification.type === 'sec-8k';
  const is52wHigh = notification.type === '52w-high';
  const is52wLow = notification.type === '52w-low';

  const borderColor = isSec8k 
    ? 'border-indigo-400 ring-indigo-50' 
    : is52wHigh 
    ? 'border-blue-400 ring-blue-50'
    : is52wLow
    ? 'border-amber-400 ring-amber-50'
    : isDown 
    ? 'border-rose-400 ring-rose-50' 
    : 'border-emerald-400 ring-emerald-50';

  const headerLabel = 
    notification.type === 'earnings-beat' || notification.type === 'beat' ? 'EARNINGS BEAT DISPATCH' :
    notification.type === 'earnings-miss' || notification.type === 'miss' ? 'EARNINGS MISS DISPATCH' :
    notification.type === 'momentum-up' ? 'MOMENTUM UP ALERT' :
    notification.type === 'momentum-down' ? 'MOMENTUM DOWN ALERT' :
    notification.type === 'sec-8k' ? 'OFFICIAL SEC FORM 8-K' :
    notification.type === '52w-high' ? '52-WEEK HIGH ALERT' :
    notification.type === '52w-low' ? '52-WEEK LOW ALERT' :
    'INSTITUTIONAL MARKET DISPATCH';

  const renderIcon = () => {
    if (notification.type === 'momentum-up') return <MomentumIcon direction="up" size={16} strokeWidth={2.5} />;
    if (notification.type === 'momentum-down') return <MomentumIcon direction="down" size={16} strokeWidth={2.5} />;
    if (notification.type === 'earnings-beat' || notification.type === 'beat') return <Award className="w-4 h-4 text-emerald-600" />;
    if (notification.type === 'earnings-miss' || notification.type === 'miss') return <AlertCircle className="w-4 h-4 text-rose-600" />;
    if (notification.type === 'sec-8k') return <FileCheck2 className="w-4 h-4 text-indigo-600" />;
    if (notification.type === '52w-high') return <TrendingUp className="w-4 h-4 text-blue-600" />;
    if (notification.type === '52w-low') return <TrendingDown className="w-4 h-4 text-amber-600" />;
    return <Bell className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="fixed top-16 right-4 sm:right-8 z-50 max-w-md w-full shadow-2xl transition-all">
      <div className={`bg-white border-2 rounded-xl p-4 text-xs text-slate-800 shadow-lg ring-4 ${borderColor}`}>
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
          <div className="flex items-center gap-2">
            {renderIcon()}
            <span className="font-bold uppercase tracking-wider font-mono-code text-[11px] text-slate-900">
              {headerLabel}
            </span>
          </div>
          <button 
            onClick={onDismiss} 
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-md transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-start gap-3 mb-2">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
            isUp ? 'bg-emerald-50 border-emerald-300 text-emerald-600 shadow-xs' :
            isDown ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-xs' :
            notification.type === 'earnings-beat' || notification.type === 'beat' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' :
            notification.type === 'earnings-miss' || notification.type === 'miss' ? 'bg-rose-50 border-rose-300 text-rose-700' :
            isSec8k ? 'bg-indigo-50 border-indigo-300 text-indigo-700' :
            is52wHigh ? 'bg-blue-50 border-blue-300 text-blue-700' :
            is52wLow ? 'bg-amber-50 border-amber-300 text-amber-700' :
            'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            {isUp ? (
              <MomentumIcon direction="up" size={26} strokeWidth={2.5} />
            ) : isDown ? (
              <MomentumIcon direction="down" size={26} strokeWidth={2.5} />
            ) : notification.type === 'earnings-beat' || notification.type === 'beat' ? (
              <Award className="w-5 h-5 text-emerald-600" />
            ) : notification.type === 'earnings-miss' || notification.type === 'miss' ? (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            ) : isSec8k ? (
              <FileCheck2 className="w-5 h-5 text-indigo-600" />
            ) : is52wHigh ? (
              <TrendingUp className="w-5 h-5 text-blue-600" />
            ) : is52wLow ? (
              <TrendingDown className="w-5 h-5 text-amber-600" />
            ) : (
              <Bell className="w-5 h-5 text-blue-600" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900 font-mono-code mb-1">
              {notification.title}
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {notification.body}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px]">
          <span className="text-slate-400 font-mono-code">
            {notification.tradingDate ? `Trading Date: ${notification.tradingDate}` : 'Delivered to desktop & log'}
          </span>
          <button
            onClick={() => {
              onViewDetails(notification.ticker);
              onDismiss();
            }}
            className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            <span>Open Profile</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
