import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useRef, useState } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  wasOffline: boolean; // becomes true if ever disconnected during session
}

export function useNetworkStatus(): NetworkStatus {
  const [state, setState] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    wasOffline: false,
  });
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    // Initial fetch
    NetInfo.fetch().then((s: NetInfoState) => {
      setState(prev => ({
        ...prev,
        isConnected: s.isConnected ?? true,
        isInternetReachable: s.isInternetReachable,
        type: s.type,
      }));
    });

    const unsubscribe = NetInfo.addEventListener((s: NetInfoState) => {
      if (s.isConnected === false) {
        wasOfflineRef.current = true;
      }
      setState({
        isConnected: s.isConnected ?? true,
        isInternetReachable: s.isInternetReachable,
        type: s.type,
        wasOffline: wasOfflineRef.current,
      });
    });

    return () => unsubscribe();
  }, []);

  return state;
}
