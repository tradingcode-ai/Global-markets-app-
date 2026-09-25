import React, { useState } from 'react';
import { PushNotificationItem, NotificationEventType } from '../types';
import { 
  X, 
  Check, 
  Trash2, 
  Bell, 
  Volume2,
  TrendingUp,
  TrendingDown,
  FileCheck2,
  ExternalLink,
  Award,
  AlertCircle
} from 'lucide-react';
import { playCorporateChime } from '../services/notificationService';
import MomentumIcon from './MomentumIcon';

interface NotificationCenterModalProps {
  notifications: PushNotificationItem[];
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onSelectTicker: (ticker: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  notifications,
  onClose,
  onMarkAllAsRead,
  onClearNotifications,
  onSelectTicker
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = notifications.filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'earnings-beat') return n.type === 'earnings-beat' || n.type === 'beat';
    if (filterType === 'earnings-miss') return n.type === 'earnings-miss' || n.type === 'miss';
    if (filterType === 'momentum-up') return n.type === 'momentum-up';
    if (filterType === 'momentum-down') return n.type === 'momentum-down';
    if (filterType === 'sec-8k') return n.type === 'sec-8k';
    if (filterType === 'technical') return n.type === '52w-high' || n.type === '52w-low';
    return n.type === filterType;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderBadge = (type: NotificationEventType) => {
    switch (type) {
      case 'earnings-beat':
      case 'beat':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Award className="w-3 h-3 text-emerald-600" />
            Earnings Beat
          </span>
        );
      case 'earnings-miss':
      case 'miss':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Earnings Miss
          </span>
        );
      case 'momentum-up':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            <MomentumIcon direction="up" size={14} strokeWidth={2.5} />
            Momentum Up
          </span>
        );
      case 'momentum-down':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-800 border border-rose-200">
            <MomentumIcon direction="down" size={14} strokeWidth={2.5} />
            Momentum Down
          </span>
        );
      case '52w-high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
            <TrendingUp className="w-3 h-3 text-blue-600" />
            52-Week High
          </span>
        );
      case '52w-low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
            <TrendingDown className="w-3 h-3 text-amber-600" />
            52-Week Low
          </span>
        );
      case 'sec-8k':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-800 border border-indigo-200">
            <FileCheck2 className="w-3 h-3 text-indigo-600" />
            SEC Form 8-K
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div 
        id="notification-center-modal"
        className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-mono-code uppercase">
                  Institutional Alerts & Dispatches
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Verified earnings releases, SEC 8-K filings & momentum signals</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => playCorporateChime()}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition text-xs flex items-center gap-1 cursor-pointer"
              title="Test Corporate Chime"
            >
              <Volume2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-medium">Chime</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer p-1.5 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'all' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType('earnings-beat')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'earnings-beat' ? 'bg-emerald-100 text-emerald-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Beats
            </button>
            <button
              onClick={() => setFilterType('earnings-miss')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'earnings-miss' ? 'bg-rose-100 text-rose-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Misses
            </button>
            <button
              onClick={() => setFilterType('momentum-up')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'momentum-up' ? 'bg-emerald-100 text-emerald-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MomentumIcon direction="up" size={15} strokeWidth={2.5} />
              <span>Momentum Up</span>
            </button>
            <button
              onClick={() => setFilterType('momentum-down')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'momentum-down' ? 'bg-rose-100 text-rose-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MomentumIcon direction="down" size={15} strokeWidth={2.5} />
              <span>Momentum Down</span>
            </button>
            <button
              onClick={() => setFilterType('sec-8k')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'sec-8k' ? 'bg-indigo-100 text-indigo-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              SEC 8-K
            </button>
            <button
              onClick={() => setFilterType('technical')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'technical' ? 'bg-blue-100 text-blue-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              52W High/Low
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Mark Read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearNotifications}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Clear notification log"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1 text-xs">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-slate-600">Geen notificaties in dit filter</p>
              <p className="text-[11px] text-slate-400 mt-1">Geverifieerde SEC Form 8-K filings en actuele marktbewegingen verschijnen hier automatisch.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isUp = item.type === 'momentum-up';
              const isDown = item.type === 'momentum-down';
              const isBeat = item.type === 'earnings-beat' || item.type === 'beat';
              const isMiss = item.type === 'earnings-miss' || item.type === 'miss';
              const isSec8k = item.type === 'sec-8k';
              const is52wHigh = item.type === '52w-high';
              const is52wLow = item.type === '52w-low';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectTicker(item.ticker);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer relative ${
                    item.read 
                      ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 shadow-2xs' 
                      : 'bg-slate-50/90 border-blue-200 hover:border-blue-300 text-slate-800 shadow-xs'
                  }`}
                >
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-3.5 right-3.5"></span>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Prominent Type/Logo Box */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isUp ? 'bg-emerald-50 border-emerald-300 text-emerald-600 shadow-xs' :
                      isDown ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-xs' :
                      isBeat ? 'bg-emerald-50 border-emerald-300 text-emerald-700' :
                      isMiss ? 'bg-rose-50 border-rose-300 text-rose-700' :
                      isSec8k ? 'bg-indigo-50 border-indigo-300 text-indigo-700' :
                      is52wHigh ? 'bg-blue-50 border-blue-300 text-blue-700' :
                      is52wLow ? 'bg-amber-50 border-amber-300 text-amber-700' :
                      'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      {isUp ? (
                        <MomentumIcon direction="up" size={24} strokeWidth={2.5} />
                      ) : isDown ? (
                        <MomentumIcon direction="down" size={24} strokeWidth={2.5} />
                      ) : isBeat ? (
                        <Award className="w-5 h-5 text-emerald-600" />
                      ) : isMiss ? (
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                      ) : isSec8k ? (
                        <FileCheck2 className="w-5 h-5 text-indigo-600" />
                      ) : is52wHigh ? (
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      ) : is52wLow ? (
                        <TrendingDown className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Bell className="w-5 h-5 text-slate-500" />
                      )}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 pr-4 flex-wrap">
                        <span className="font-mono-code font-bold text-xs text-slate-900">
                          {item.ticker}
                        </span>
                        {renderBadge(item.type)}
                        {item.tradingDate && (
                          <span className="text-[10px] text-slate-400 font-mono-code">
                            {item.tradingDate}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 ml-auto font-mono-code">
                          {item.timestamp}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-slate-900 mb-1">
                        {item.title}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.body}
                      </p>

                      {item.metadata?.filingUrl && (
                        <div className="mt-2">
                          <a
                            href={item.metadata.filingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Officiële SEC EDGAR Disclosure ↗</span>
                          </a>
                        </div>
                      )}

                      {item.metrics && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-3 text-[11px] font-mono-code text-slate-500 flex-wrap">
                          {item.metrics.epsActual !== undefined && (
                            <span>EPS: <strong className="text-slate-900 font-bold">${item.metrics.epsActual.toFixed(2)}</strong></span>
                          )}
                          {item.metrics.epsEstimate !== undefined && item.metrics.epsActual !== undefined && (
                            <span>Cons: <strong className="text-slate-600">${item.metrics.epsEstimate.toFixed(2)}</strong></span>
                          )}
                          {item.metrics.revenueActual !== undefined && (
                            <span>Rev: <strong className="text-slate-900 font-bold">${item.metrics.revenueActual.toFixed(2)}B</strong></span>
                          )}
                          {item.metrics.priceMove !== undefined && (
                            <span className={`inline-flex items-center gap-1 font-bold ${item.metrics.priceMove >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {item.metrics.priceMove >= 0 ? (
                                <MomentumIcon direction="up" size={13} strokeWidth={2.5} />
                              ) : (
                                <MomentumIcon direction="down" size={13} strokeWidth={2.5} />
                              )}
                              <span>{item.metrics.priceMove >= 0 ? '+' : ''}{item.metrics.priceMove.toFixed(1)}%</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-slate-500 text-xs flex items-center justify-between">
          <span className="text-[11px]">SEC EDGAR Form 8-K Submissions & Live Market Quotes Feed</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition text-xs cursor-pointer"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
