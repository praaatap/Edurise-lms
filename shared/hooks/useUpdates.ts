import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const useUpdates = () => {
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (__DEV__) return; // Don't check in development

    const checkUpdates = async () => {
      try {
        setIsChecking(true);
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          Alert.alert(
            'Update Available',
            'A new version of the app is available. Would you like to update now?',
            [
              { text: 'Later', style: 'cancel' },
              { 
                text: 'Update', 
                onPress: async () => {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                } 
              }
            ]
          );
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkUpdates();
  }, []);

  return { isChecking };
};
