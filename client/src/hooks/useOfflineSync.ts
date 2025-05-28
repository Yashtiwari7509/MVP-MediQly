import { useCallback } from 'react';
import { useIndexedDB } from './useIndexedDB';
import axios from 'axios';

export const useOfflineSync = () => {
  const { getAll, getByIndex, update } = useIndexedDB();

  const syncOfflineActions = useCallback(async () => {
    try {
      // Get all unsynced actions
      const unsyncedActions = await getByIndex('offlineActions', 'by-synced', false);

      for (const action of unsyncedActions) {
        try {
          // Attempt to sync the action
          await axios.post(`${import.meta.env.VITE_API_URL}/api/sync`, {
            action: action.action,
            data: action.data,
          });

          // Mark as synced if successful
          await update('offlineActions', action.id, {
            ...action,
            synced: true,
          });
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          // Continue with next action even if one fails
        }
      }
    } catch (error) {
      console.error('Error during offline sync:', error);
      throw error;
    }
  }, [getByIndex, update]);

  return {
    syncOfflineActions,
  };
}; 