import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMongoDbMock } = vi.hoisted(() => ({
  getMongoDbMock: vi.fn(),
}));

vi.mock('#common/db', () => ({
  getMongoDb: getMongoDbMock,
}));

import { FeatureFlagService } from './feature-flag.service';

describe('FeatureFlagService (memory fallback)', () => {
  beforeEach(() => {
    getMongoDbMock.mockReset();
    getMongoDbMock.mockRejectedValue(new Error('Mongo unavailable'));
  });

  it('creates and retrieves feature flags when Mongo is unavailable', async () => {
    const service = new FeatureFlagService();

    await service.createFlag({
      key: 'new_dashboard',
      enabled: true,
      description: 'Enable new dashboard view',
    });

    const flags = await service.getAllFlags();

    expect(flags).toHaveLength(1);
    expect(flags[0].key).toBe('new_dashboard');
    expect(flags[0].enabled).toBe(true);
    expect(flags[0].description).toBe('Enable new dashboard view');
  });

  it('updates and deletes feature flags in memory fallback', async () => {
    const service = new FeatureFlagService();

    await service.createFlag({
      key: 'beta_search',
      enabled: false,
      description: 'New ranking strategy',
    });

    const updated = await service.updateFlag('beta_search', {
      enabled: true,
      description: 'New ranking strategy v2',
    });

    expect(updated).not.toBeNull();
    expect(updated?.enabled).toBe(true);
    expect(updated?.description).toBe('New ranking strategy v2');

    const removed = await service.deleteFlag('beta_search');
    const afterDelete = await service.getFlagByKey('beta_search');

    expect(removed).toBe(true);
    expect(afterDelete).toBeNull();
  });

  it('returns false for missing feature flags', async () => {
    const service = new FeatureFlagService();
    const enabled = await service.isFlagEnabled('does_not_exist');

    expect(enabled).toBe(false);
  });
});
