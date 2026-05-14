import { useEffect } from 'react';
import { clarityService } from '@/core/services/clarityService';
import { trackScreenView } from '@/core/services/sentryPerformance';

export function useScreenTracking(screenName: string) {
  useEffect(() => {
    clarityService.setScreen(screenName);
    trackScreenView(screenName);
  }, [screenName]);
}
