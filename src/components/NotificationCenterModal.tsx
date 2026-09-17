import React, { useState } from 'react';
import { PushNotificationItem } from '../types';
import { 
  X, 
  Check, 
  Trash2, 
  Bell, 
  Volume2
} from 'lucide-react';
import { playCorporateChime } from '../services/notificationService';

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
    return n.type === filterType;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div 
        id="notification-center-modal"
        className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Soft Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-mono-code uppercase">
                  Push Notification Center
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">History of dispatched earnings alerts and breakings</p>
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
              onClick={() => setFilterType('beat')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'beat' ? 'bg-emerald-100 text-emerald-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Beats
            </button>
            <button
              onClick={() => setFilterType('miss')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'miss' ? 'bg-rose-100 text-rose-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Misses
            </button>
            <button
              onClick={() => setFilterType('guidance')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'guidance' ? 'bg-blue-100 text-blue-900 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Guidance
            </button>
          </div>

          <div className="flex items-center gap-2">
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
              <p className="font-semibold text-slate-600">No push notifications in this view</p>
              <p className="text-[11px] text-slate-400 mt-1">Live tech earnings alerts will appear here as they are released.</p>
            </div>
          ) : (
            filtered.map((item) => (
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

                <div className="flex items-center gap-2 mb-1.5 pr-4">
                  <span className="font-mono-code font-bold text-xs text-slate-900">
                    {item.ticker}
                  </span>
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase ${
                    item.type === 'beat' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : item.type === 'miss' 
                      ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {item.type}
                  </span>
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

                {item.metrics && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-3 text-[11px] font-mono-code text-slate-500">
                    {item.metrics.epsActual !== undefined && (
                      <span>EPS: <strong className="text-slate-900 font-bold">${item.metrics.epsActual.toFixed(2)}</strong></span>
                    )}
                    {item.metrics.revenueActual !== undefined && (
                      <span>Rev: <strong className="text-slate-900 font-bold">${item.metrics.revenueActual.toFixed(2)}B</strong></span>
                    )}
                    {item.metrics.priceMove !== undefined && (
                      <span className={item.metrics.priceMove >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {item.metrics.priceMove >= 0 ? '+' : ''}{item.metrics.priceMove.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-slate-500 text-xs flex items-center justify-between">
          <span>Real-time SEC 8-K & IR wire push feed</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition text-xs cursor-pointer"
          >
            Close Feed
          </button>
        </div>
      </div>
    </div>
  );
};
