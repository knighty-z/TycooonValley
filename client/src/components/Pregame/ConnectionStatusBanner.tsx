import React from 'react';
import type { RealtimeConnectionStatus } from '../../services/supabase/realtime.js';
import type { ThemeConfig } from '../../themes/types.js';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

export interface ConnectionStatusBannerProps {
  status: RealtimeConnectionStatus;
  themeConfig: ThemeConfig;
  errorDetail?: string | null;
  onRetry?: () => void;
}

export const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = React.memo(
  ({ status, themeConfig, errorDetail, onRetry }) => {
    if (status === 'CONNECTED' || status === 'IDLE' || status === 'CONNECTING') {
      return null;
    }

    const isReconnecting = status === 'RECONNECTING';

    return (
      <div
        role="alert"
        data-testid="connection-status-banner"
        data-status={status}
        style={{
          backgroundColor: isReconnecting
            ? 'rgba(180, 83, 9, 0.22)'
            : 'rgba(153, 27, 27, 0.26)',
          borderColor: isReconnecting
            ? 'rgba(245, 158, 11, 0.55)'
            : 'rgba(239, 68, 68, 0.58)',
          borderRadius: themeConfig.chamfered ? '0px' : '4px'
        }}
        className="w-full px-3.5 py-2 border flex items-center justify-between gap-3 text-xs shrink-0"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {isReconnecting ? (
            <RefreshCw className="w-4 h-4 text-amber-300 animate-spin shrink-0" />
          ) : status === 'ERROR' ? (
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 text-rose-300 shrink-0" />
          )}
          <div className="min-w-0">
            <span className="font-bold mr-1.5">
              {isReconnecting ? 'Reconnecting to server...' : 'Connection lost'}
            </span>
            <span className="opacity-80">
              {errorDetail ||
                (isReconnecting
                  ? 'Restoring live room synchronization automatically.'
                  : 'Live room sync was interrupted. Check your network and retry.')}
            </span>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            data-testid="retry-connection-btn"
            data-chamfered={themeConfig.chamfered ? 'true' : 'false'}
            className="tv-hud-btn tv-hud-btn-secondary px-2.5 py-1 text-[11px] shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }
);

ConnectionStatusBanner.displayName = 'ConnectionStatusBanner';
