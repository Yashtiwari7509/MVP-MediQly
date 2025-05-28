import { useState, useCallback } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface HealthAppDB extends DBSchema {
  fitnessData: {
    key: string;
    value: any;
  };
  offlineActions: {
    key: string;
    value: {
      id: string;
      action: string;
      data: any;
      timestamp: number;
      synced: boolean;
    };
    indexes: {
      'by-synced': boolean;
    };
  };
}

type StoreName = 'fitnessData' | 'offlineActions';

export const useIndexedDB = () => {
  const [db, setDb] = useState<IDBPDatabase<HealthAppDB> | null>(null);

  const initDB = useCallback(async () => {
    if (db) return db;

    const database = await openDB<HealthAppDB>('healthApp', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('fitnessData')) {
          db.createObjectStore('fitnessData');
        }
        if (!db.objectStoreNames.contains('offlineActions')) {
          const store = db.createObjectStore('offlineActions', { keyPath: 'id' });
          store.createIndex('by-synced', 'synced', { unique: false });
        }
      },
    });

    setDb(database);
    return database;
  }, [db]);

  const add = useCallback(async (storeName: StoreName, data: any) => {
    const database = await initDB();
    return database.add(storeName, data);
  }, [initDB]);

  const getAll = useCallback(async (storeName: StoreName) => {
    const database = await initDB();
    return database.getAll(storeName);
  }, [initDB]);

  const getByIndex = useCallback(async (storeName: StoreName, indexName: string, value: any) => {
    const database = await initDB();
    const tx = database.transaction(storeName, 'readonly');
    const index = tx.store.index(indexName);
    return index.getAll(value);
  }, [initDB]);

  const update = useCallback(async (storeName: StoreName, key: string, data: any) => {
    const database = await initDB();
    return database.put(storeName, data, key);
  }, [initDB]);

  const remove = useCallback(async (storeName: StoreName, key: string) => {
    const database = await initDB();
    return database.delete(storeName, key);
  }, [initDB]);

  return {
    add,
    getAll,
    getByIndex,
    update,
    remove,
  };
}; 