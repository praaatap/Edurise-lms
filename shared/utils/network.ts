import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    // Initial fetch
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? true);
      setConnectionType(state.type);
    });

    // Subscribe for updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? true);
      setConnectionType(state.type);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { isConnected, connectionType };
}
