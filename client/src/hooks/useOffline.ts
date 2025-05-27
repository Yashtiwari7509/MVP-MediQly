import { useState, useEffect } from 'react';
import { offlineStorage } from '@/services/indexedDB';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Function to save data offline
  const saveOfflineData = async (type: string, data: any) => {
    try {
      switch (type) {
        case 'symptom':
          await offlineStorage.saveSymptom(data);
          break;
        case 'medication':
          await offlineStorage.saveMedication(data);
          break;
        case 'healthMetric':
          await offlineStorage.saveHealthMetric(data);
          break;
        default:
          await offlineStorage.saveOfflineAction(type, data);
      }
      return true;
    } catch (error) {
      console.error('Error saving offline data:', error);
      return false;
    }
  };

  // Function to get offline data
  const getOfflineData = async (type: string) => {
    try {
      switch (type) {
        case 'symptoms':
          return await offlineStorage.getSymptoms();
        case 'medications':
          return await offlineStorage.getMedications();
        case 'healthMetrics':
          return await offlineStorage.getHealthMetrics();
        default:
          return [];
      }
    } catch (error) {
      console.error('Error getting offline data:', error);
      return [];
    }
  };

  // Function to sync offline data when back online
  const syncOfflineData = async () => {
    if (!isOnline || isSyncing) return;

    try {
      setIsSyncing(true);
      const pendingActions = await offlineStorage.getPendingOfflineActions();

      for (const action of pendingActions) {
        try {
          // Here you would implement the actual sync logic with your backend
          // For example:
          // await api.post(`/api/${action.type}`, action.data);
          await offlineStorage.markActionAsSynced(action.id);
        } catch (error) {
          console.error('Error syncing action:', error);
        }
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncOfflineData();
    }
  }, [isOnline]);

  return {
    isOnline,
    isSyncing,
    saveOfflineData,
    getOfflineData,
    syncOfflineData,
  };
}; 