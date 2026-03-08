import { getMongoDb } from '#common/db';
import type {
  FeatureFlag,
  FeatureFlagCreateInput,
  FeatureFlagUpdateInput,
} from '../models/feature-flag.model';

export class FeatureFlagService {
  private readonly collectionName = 'feature_flags';
  private memoryStore = new Map<string, FeatureFlag>();

  /**
   * Get all feature flags
   */
  async getAllFlags(): Promise<FeatureFlag[]> {
    try {
      const db = await getMongoDb();
      const collection = db.collection(this.collectionName);
      const flags = await collection.find({}).toArray();
      return flags.map(this.mapToFeatureFlag);
    } catch {
      // Fallback to memory
      return Array.from(this.memoryStore.values());
    }
  }

  /**
   * Get a specific feature flag by key
   */
  async getFlagByKey(key: string): Promise<FeatureFlag | null> {
    try {
      const db = await getMongoDb();
      const collection = db.collection(this.collectionName);
      const flag = await collection.findOne({ key });
      return flag ? this.mapToFeatureFlag(flag) : null;
    } catch {
      // Fallback to memory
      return this.memoryStore.get(key) || null;
    }
  }

  /**
   * Check if a feature flag is enabled
   */
  async isFlagEnabled(key: string): Promise<boolean> {
    const flag = await this.getFlagByKey(key);
    return flag?.enabled || false;
  }

  /**
   * Create a new feature flag
   */
  async createFlag(input: FeatureFlagCreateInput): Promise<FeatureFlag> {
    const now = new Date();
    const flag: FeatureFlag = {
      key: input.key,
      enabled: input.enabled,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const db = await getMongoDb();
      const collection = db.collection(this.collectionName);
      await collection.insertOne(flag);
      return flag;
    } catch {
      // Fallback to memory
      this.memoryStore.set(flag.key, flag);
      return flag;
    }
  }

  /**
   * Update an existing feature flag
   */
  async updateFlag(
    key: string,
    input: FeatureFlagUpdateInput
  ): Promise<FeatureFlag | null> {
    try {
      const db = await getMongoDb();
      const collection = db.collection(this.collectionName);
      const updateDoc = {
        $set: {
          ...input,
          updatedAt: new Date(),
        },
      };
      const result = await collection.findOneAndUpdate({ key }, updateDoc, {
        returnDocument: 'after',
      });
      return result ? this.mapToFeatureFlag(result) : null;
    } catch {
      // Fallback to memory
      const existing = this.memoryStore.get(key);
      if (!existing) return null;

      const updated: FeatureFlag = {
        ...existing,
        ...input,
        updatedAt: new Date(),
      };
      this.memoryStore.set(key, updated);
      return updated;
    }
  }

  /**
   * Delete a feature flag
   */
  async deleteFlag(key: string): Promise<boolean> {
    try {
      const db = await getMongoDb();
      const collection = db.collection(this.collectionName);
      const result = await collection.deleteOne({ key });
      return result.deletedCount > 0;
    } catch {
      // Fallback to memory
      return this.memoryStore.delete(key);
    }
  }

  /**
   * Helper to map MongoDB document to FeatureFlag
   */
  private mapToFeatureFlag(doc: any): FeatureFlag {
    return {
      key: doc.key,
      enabled: doc.enabled,
      description: doc.description,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
