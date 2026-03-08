import { getMongoDb } from '#common/db';
import type { SystemSetting, SystemSettingUpsertInput } from '../models/system-setting.model';

export class SystemSettingService {
  private readonly collectionName = 'system_settings';
  private memoryStore = new Map<string, SystemSetting>();

  async listSettings(): Promise<SystemSetting[]> {
    try {
      const db = await getMongoDb();
      const docs = await db.collection(this.collectionName).find({}).toArray();
      return docs.map(this.mapDoc);
    } catch {
      return Array.from(this.memoryStore.values());
    }
  }

  async getSetting(key: string): Promise<SystemSetting | null> {
    try {
      const db = await getMongoDb();
      const doc = await db.collection(this.collectionName).findOne({ key });
      return doc ? this.mapDoc(doc) : null;
    } catch {
      return this.memoryStore.get(key) || null;
    }
  }

  async upsertSetting(input: SystemSettingUpsertInput): Promise<SystemSetting> {
    const next: SystemSetting = {
      key: input.key,
      value: input.value,
      description: input.description,
      updatedBy: input.updatedBy,
      updatedAt: new Date(),
    };

    try {
      const db = await getMongoDb();
      const collection = db.collection(this.collectionName);
      await collection.updateOne(
        { key: input.key },
        {
          $set: {
            value: input.value,
            description: input.description,
            updatedBy: input.updatedBy,
            updatedAt: next.updatedAt,
          },
        },
        { upsert: true },
      );

      const stored = await collection.findOne({ key: input.key });
      return stored ? this.mapDoc(stored) : next;
    } catch {
      this.memoryStore.set(input.key, next);
      return next;
    }
  }

  async deleteSetting(key: string): Promise<boolean> {
    try {
      const db = await getMongoDb();
      const result = await db.collection(this.collectionName).deleteOne({ key });
      return result.deletedCount > 0;
    } catch {
      return this.memoryStore.delete(key);
    }
  }

  private mapDoc(doc: any): SystemSetting {
    return {
      key: doc.key,
      value: doc.value,
      description: doc.description,
      updatedBy: doc.updatedBy,
      updatedAt: doc.updatedAt,
    };
  }
}
