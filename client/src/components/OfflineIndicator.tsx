import { useOffline } from '@/hooks/useOffline';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const OfflineIndicator = () => {
  const { isOnline, isSyncing, syncOfflineData } = useOffline();

  if (isOnline && !isSyncing) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${
        isOnline ? 'bg-yellow-500' : 'bg-red-500'
      } text-white`}>
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Syncing...</span>
            <RefreshCw className="h-4 w-4 animate-spin" />
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Offline Mode</span>
          </>
        )}
      </div>
    </div>
  );
}; 