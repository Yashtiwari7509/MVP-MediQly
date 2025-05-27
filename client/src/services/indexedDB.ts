import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface HealthAppDB extends DBSchema {
  symptoms: {
    key: string;
    value: {
      id: string;
      name: string;
      description: string;
      severity: string;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
  medications: {
    key: string;
    value: {
      id: string;
      name: string;
      dosage: string;
      schedule: string;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
  healthMetrics: {
    key: string;
    value: {
      id: string;
      type: string;
      value: number;
      unit: string;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
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
    indexes: { 'by-synced': boolean };
  };
}

const DB_NAME = 'health-app-offline';
const DB_VERSION = 1;

export class OfflineStorage {
  private db: IDBPDatabase<HealthAppDB> | null = null;

  async initialize(): Promise<void> {
    this.db = await openDB<HealthAppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create stores with indexes
        const symptomsStore = db.createObjectStore('symptoms', { keyPath: 'id' });
        symptomsStore.createIndex('by-timestamp', 'timestamp');

        const medicationsStore = db.createObjectStore('medications', { keyPath: 'id' });
        medicationsStore.createIndex('by-timestamp', 'timestamp');

        const healthMetricsStore = db.createObjectStore('healthMetrics', { keyPath: 'id' });
        healthMetricsStore.createIndex('by-timestamp', 'timestamp');

        const offlineActionsStore = db.createObjectStore('offlineActions', { keyPath: 'id' });
        offlineActionsStore.createIndex('by-synced', 'synced');
      },
    });
  }

  // Symptoms
  async saveSymptom(symptom: any): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.put('symptoms', {
      ...symptom,
      timestamp: Date.now(),
    });
  }

  async getSymptoms(): Promise<any[]> {
    if (!this.db) await this.initialize();
    return this.db!.getAllFromIndex('symptoms', 'by-timestamp');
  }

  // Medications
  async saveMedication(medication: any): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.put('medications', {
      ...medication,
      timestamp: Date.now(),
    });
  }

  async getMedications(): Promise<any[]> {
    if (!this.db) await this.initialize();
    return this.db!.getAllFromIndex('medications', 'by-timestamp');
  }

  // Health Metrics
  async saveHealthMetric(metric: any): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.put('healthMetrics', {
      ...metric,
      timestamp: Date.now(),
    });
  }

  async getHealthMetrics(): Promise<any[]> {
    if (!this.db) await this.initialize();
    return this.db!.getAllFromIndex('healthMetrics', 'by-timestamp');
  }

  // Offline Actions
  async saveOfflineAction(action: string, data: any): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.put('offlineActions', {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: Date.now(),
      synced: false,
    });
  }

  async getPendingOfflineActions(): Promise<any[]> {
    if (!this.db) await this.initialize();
    return this.db!.getAllFromIndex('offlineActions', 'by-synced', false);
  }

  async markActionAsSynced(id: string): Promise<void> {
    if (!this.db) await this.initialize();
    const action = await this.db!.get('offlineActions', id);
    if (action) {
      action.synced = true;
      await this.db!.put('offlineActions', action);
    }
  }

  // Utility methods
  async clearOldData(daysToKeep = 30): Promise<void> {
    if (!this.db) await this.initialize();
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    const stores = ['symptoms', 'medications', 'healthMetrics'] as const;
    for (const store of stores) {
      const oldItems = await this.db!.getAllFromIndex(store, 'by-timestamp');
      for (const item of oldItems) {
        if (item.timestamp < cutoffTime) {
          await this.db!.delete(store, item.id);
        }
      }
    }
  }
}

export const offlineStorage = new OfflineStorage(); 