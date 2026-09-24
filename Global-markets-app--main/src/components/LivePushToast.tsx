import React, { useEffect } from 'react';
import { PushNotificationItem } from '../types';
import { Bell, X, ChevronRight } from 'lucide-react';

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

  return (
    <div className="fixed top-16 right-4 sm:right-8 z-50 max-w-md w-full shadow-2xl transition-all">
      <div className="bg-white border-2 border-emerald-400 rounded-xl p-4 text-xs text-slate-800 shadow-lg ring-4 ring-emerald-50">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold uppercase tracking-wider font-mono-code text-[11px] text-emerald-800 flex items-center gap-1">
              <Bell className="w-3.5 h-3.5 text-emerald-600" />
              LIVE EARNINGS PUSH DISPATCHED
            </span>
          </div>
          <button 
            onClick={onDismiss} 
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-md transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="font-bold text-slate-900 font-mono-code mb-1">
          {notification.title}
        </div>
        <p className="text-slate-600 text-[11px] leading-relaxed mb-3">
          {notification.body}
        </p>

        <div className="flex items-center justify-between pt-1 text-[11px]">
          <span className="text-slate-400 font-mono-code">
            Delivered to desktop & notification log
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
