import React, { useState } from 'react';
import { Button } from '../../../shared/ui';
import useAdminAuth from '../hooks/useAdminAuth';

const AdminShell = () => {
  const {
    isAuthenticated,
    isBootstrapping,
    loginMutation,
    logoutMutation,
    twoFactorStatusQuery,
    healthQuery,
    auditLogsQuery,
    securityStatusQuery,
    usageSummaryQuery,
    featureFlagsQuery,
    createFeatureFlagMutation,
    updateFeatureFlagMutation,
    deleteFeatureFlagMutation,
    systemSettingsQuery,
    upsertSystemSettingMutation,
    deleteSystemSettingMutation,
    adminSessionsQuery,
    revokeAdminSessionMutation,
    adminUsersQuery,
    createAdminUserMutation,
    updateAdminUserMutation,
    deleteAdminUserMutation,
  } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newFlagKey, setNewFlagKey] = useState('');
  const [newFlagDescription, setNewFlagDescription] = useState('');
  const [newFlagEnabled, setNewFlagEnabled] = useState(false);
  const [settingKey, setSettingKey] = useState('');
  const [settingValue, setSettingValue] = useState('');
  const [settingDescription, setSettingDescription] = useState('');
  const [adminUserEmail, setAdminUserEmail] = useState('');
  const [adminUserPassword, setAdminUserPassword] = useState('');
  const [adminUserRole, setAdminUserRole] = useState('admin');
  const [adminUserActive, setAdminUserActive] = useState(true);

  const submitLogin = (event) => {
    event.preventDefault();

    const normalizedEmail = String(email || '').trim();
    const normalizedPassword = String(password || '');

    if (!normalizedEmail || !normalizedPassword) {
      return;
    }

    loginMutation.mutate({
      email: normalizedEmail,
      password: normalizedPassword,
      otp: String(otp || '').trim() || undefined,
    });
  };

  const submitNewFeatureFlag = (event) => {
    event.preventDefault();
    const key = String(newFlagKey || '').trim();

    if (!key) {
      return;
    }

    createFeatureFlagMutation.mutate(
      {
        key,
        enabled: newFlagEnabled,
        description: String(newFlagDescription || '').trim() || undefined,
      },
      {
        onSuccess: () => {
          setNewFlagKey('');
          setNewFlagDescription('');
          setNewFlagEnabled(false);
        },
      }
    );
  };

  const toggleFeatureFlag = (flag) => {
    updateFeatureFlagMutation.mutate({
      key: flag.key,
      patch: { enabled: !flag.enabled },
    });
  };

  const removeFeatureFlag = (flagKey) => {
    deleteFeatureFlagMutation.mutate(flagKey);
  };

  const submitSystemSetting = (event) => {
    event.preventDefault();

    const key = String(settingKey || '').trim();
    if (!key) {
      return;
    }

    let parsedValue = settingValue;
    if (settingValue === 'true') parsedValue = true;
    if (settingValue === 'false') parsedValue = false;
    if (settingValue === 'null') parsedValue = null;
    if (settingValue !== '' && !Number.isNaN(Number(settingValue)) && settingValue.trim() !== '') {
      parsedValue = Number(settingValue);
    }

    upsertSystemSettingMutation.mutate(
      {
        key,
        value: parsedValue,
        description: String(settingDescription || '').trim() || undefined,
      },
      {
        onSuccess: () => {
          setSettingKey('');
          setSettingValue('');
          setSettingDescription('');
        },
      }
    );
  };

  const submitAdminUser = (event) => {
    event.preventDefault();

    const email = String(adminUserEmail || '').trim().toLowerCase();
    const password = String(adminUserPassword || '');

    if (!email || !password) {
      return;
    }

    createAdminUserMutation.mutate(
      {
        email,
        password,
        role: adminUserRole === 'superadmin' ? 'superadmin' : 'admin',
        isActive: adminUserActive,
      },
      {
        onSuccess: () => {
          setAdminUserEmail('');
          setAdminUserPassword('');
          setAdminUserRole('admin');
          setAdminUserActive(true);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background text-primary p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="panel-card p-5 md:p-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="type-display">Admin Console</h1>
            <p className="type-body text-gray-300 mt-2">
              Secure control panel for system checks, sessions, and audit activity.
            </p>
          </div>

          {isAuthenticated && (
            <Button
              variant="panel"
              size="md"
              loading={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              Logout
            </Button>
          )}
        </div>

        {isBootstrapping ? (
          <div className="panel-card p-5 md:p-7 max-w-xl">
            <p className="type-body text-gray-300">Checking admin session...</p>
          </div>
        ) : !isAuthenticated ? (
          <form onSubmit={submitLogin} className="panel-card p-5 md:p-7 max-w-xl space-y-4">
            <h2 className="type-title">Admin Login</h2>
            <p className="type-body text-gray-300">Use your configured admin credentials to continue.</p>

            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full settings-input type-body focus:outline-none"
                placeholder="Admin email"
                autoComplete="username"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full settings-input type-body focus:outline-none"
                placeholder="Password"
                autoComplete="current-password"
              />
              {twoFactorStatusQuery.data?.enabled && (
                <input
                  type="text"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  className="w-full settings-input type-body focus:outline-none"
                  placeholder="2FA code (6 digits)"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              )}
            </div>

            {twoFactorStatusQuery.data?.enabled && (
              <p className="type-caption text-gray-400">Two-factor authentication is enabled for this admin account.</p>
            )}

            {loginMutation.isError && (
              <p className="type-body text-red-300">{loginMutation.error?.message || 'Login failed'}</p>
            )}

            <Button
              type="submit"
              variant="elevated"
              size="md"
              loading={loginMutation.isPending}
            >
              Sign In
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="panel-card p-5 md:p-6">
                <p className="type-caption text-gray-300 mb-2">System Status</p>
                {healthQuery.isLoading ? (
                  <p className="type-body text-gray-200">Checking health...</p>
                ) : healthQuery.isError ? (
                  <p className="type-body text-red-300">{healthQuery.error?.message || 'Failed to load health'}</p>
                ) : (
                  <div className="space-y-2">
                    <p className="type-body text-white">Status: {healthQuery.data?.status || 'unknown'}</p>
                    <p className="type-body text-gray-300">Environment: {healthQuery.data?.environment || '-'}</p>
                    <p className="type-body text-gray-300">Active Sessions: {healthQuery.data?.activeSessionCount ?? 0}</p>
                  </div>
                )}
              </div>

              <div className="panel-card p-5 md:p-6">
                <p className="type-caption text-gray-300 mb-2">Audit Stream</p>
                <p className="type-body text-gray-200">
                  {auditLogsQuery.data?.length || 0} recent events loaded
                </p>
                <Button
                  variant="panel"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    healthQuery.refetch();
                    auditLogsQuery.refetch();
                    securityStatusQuery.refetch();
                    featureFlagsQuery.refetch();
                    systemSettingsQuery.refetch();
                    usageSummaryQuery.refetch();
                    adminSessionsQuery.refetch();
                    adminUsersQuery.refetch();
                  }}
                >
                  Refresh Data
                </Button>
              </div>
            </div>

            <div className="panel-card p-5 md:p-6">
              <p className="type-title mb-3">Usage Summary (24h)</p>

              {usageSummaryQuery.isLoading ? (
                <p className="type-body text-gray-300">Loading usage summary...</p>
              ) : usageSummaryQuery.isError ? (
                <p className="type-body text-red-300">{usageSummaryQuery.error?.message || 'Failed to load usage summary'}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="type-caption text-gray-400">Total Audit Events</p>
                    <p className="type-body text-white mt-1">{usageSummaryQuery.data?.totalAuditEvents ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="type-caption text-gray-400">Events (24h)</p>
                    <p className="type-body text-white mt-1">{usageSummaryQuery.data?.events24h ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="type-caption text-gray-400">Failed Logins (24h)</p>
                    <p className="type-body text-white mt-1">{usageSummaryQuery.data?.failedLogins24h ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="type-caption text-gray-400">Unique IPs (24h)</p>
                    <p className="type-body text-white mt-1">{usageSummaryQuery.data?.uniqueIps24h ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="type-caption text-gray-400">Active Sessions</p>
                    <p className="type-body text-white mt-1">{usageSummaryQuery.data?.activeSessionCount ?? 0}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="panel-card p-5 md:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="type-title">System Settings</p>
                <Button variant="panel" size="sm" onClick={() => systemSettingsQuery.refetch()}>
                  Refresh Settings
                </Button>
              </div>

              <form onSubmit={submitSystemSetting} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                <input
                  type="text"
                  value={settingKey}
                  onChange={(event) => setSettingKey(event.target.value)}
                  className="settings-input type-body focus:outline-none"
                  placeholder="setting_key"
                />
                <input
                  type="text"
                  value={settingValue}
                  onChange={(event) => setSettingValue(event.target.value)}
                  className="settings-input type-body focus:outline-none"
                  placeholder="value"
                />
                <input
                  type="text"
                  value={settingDescription}
                  onChange={(event) => setSettingDescription(event.target.value)}
                  className="settings-input type-body focus:outline-none md:col-span-2"
                  placeholder="Description (optional)"
                />

                <div className="md:col-span-4">
                  <Button
                    type="submit"
                    variant="elevated"
                    size="sm"
                    loading={upsertSystemSettingMutation.isPending}
                  >
                    Save Setting
                  </Button>
                </div>
              </form>

              {(upsertSystemSettingMutation.isError || deleteSystemSettingMutation.isError) && (
                <p className="type-body text-red-300 mb-4">
                  {upsertSystemSettingMutation.error?.message ||
                    deleteSystemSettingMutation.error?.message ||
                    'System setting request failed'}
                </p>
              )}

              {systemSettingsQuery.isLoading ? (
                <p className="type-body text-gray-300">Loading system settings...</p>
              ) : systemSettingsQuery.isError ? (
                <p className="type-body text-red-300">{systemSettingsQuery.error?.message || 'Failed to load system settings'}</p>
              ) : systemSettingsQuery.data?.length ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {systemSettingsQuery.data.map((setting) => (
                    <div key={setting.key} className="rounded-lg border border-white/10 bg-white/5 p-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="type-body text-white">{setting.key}</p>
                        <p className="type-caption text-gray-300 mt-1">{String(setting.value)}</p>
                        <p className="type-caption text-gray-400 mt-1">{setting.description || 'No description'}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        loading={deleteSystemSettingMutation.isPending}
                        onClick={() => deleteSystemSettingMutation.mutate(setting.key)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="type-body text-gray-300">No system settings configured yet.</p>
              )}
            </div>

            <div className="panel-card p-5 md:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="type-title">Feature Flags</p>
                <Button
                  variant="panel"
                  size="sm"
                  onClick={() => featureFlagsQuery.refetch()}
                >
                  Refresh Flags
                </Button>
              </div>

              <form onSubmit={submitNewFeatureFlag} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                <input
                  type="text"
                  value={newFlagKey}
                  onChange={(event) => setNewFlagKey(event.target.value)}
                  className="settings-input type-body focus:outline-none"
                  placeholder="flag_key"
                />
                <input
                  type="text"
                  value={newFlagDescription}
                  onChange={(event) => setNewFlagDescription(event.target.value)}
                  className="settings-input type-body focus:outline-none md:col-span-2"
                  placeholder="Description (optional)"
                />
                <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={newFlagEnabled}
                    onChange={(event) => setNewFlagEnabled(event.target.checked)}
                  />
                  Enabled
                </label>

                <div className="md:col-span-4">
                  <Button
                    type="submit"
                    variant="elevated"
                    size="sm"
                    loading={createFeatureFlagMutation.isPending}
                  >
                    Create Feature Flag
                  </Button>
                </div>
              </form>

              {(createFeatureFlagMutation.isError || updateFeatureFlagMutation.isError || deleteFeatureFlagMutation.isError) && (
                <p className="type-body text-red-300 mb-4">
                  {createFeatureFlagMutation.error?.message ||
                    updateFeatureFlagMutation.error?.message ||
                    deleteFeatureFlagMutation.error?.message ||
                    'Feature flag request failed'}
                </p>
              )}

              {featureFlagsQuery.isLoading ? (
                <p className="type-body text-gray-300">Loading feature flags...</p>
              ) : featureFlagsQuery.isError ? (
                <p className="type-body text-red-300">{featureFlagsQuery.error?.message || 'Failed to load feature flags'}</p>
              ) : featureFlagsQuery.data?.length ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {featureFlagsQuery.data.map((flag) => (
                    <div key={flag.key} className="rounded-lg border border-white/10 bg-white/5 p-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="type-body text-white">{flag.key}</p>
                        <p className="type-caption text-gray-300 mt-1">{flag.description || 'No description'}</p>
                      </div>

                      <div className="inline-flex items-center gap-2">
                        <Button
                          variant={flag.enabled ? 'elevated' : 'panel'}
                          size="sm"
                          loading={updateFeatureFlagMutation.isPending}
                          onClick={() => toggleFeatureFlag(flag)}
                        >
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={deleteFeatureFlagMutation.isPending}
                          onClick={() => removeFeatureFlag(flag.key)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="type-body text-gray-300">No feature flags configured yet.</p>
              )}
            </div>

            <div className="panel-card p-5 md:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="type-title">Session Management</p>
                <Button variant="panel" size="sm" onClick={() => adminSessionsQuery.refetch()}>
                  Refresh Sessions
                </Button>
              </div>

              {revokeAdminSessionMutation.isError && (
                <p className="type-body text-red-300 mb-4">
                  {revokeAdminSessionMutation.error?.message || 'Failed to revoke session'}
                </p>
              )}

              {adminSessionsQuery.isLoading ? (
                <p className="type-body text-gray-300">Loading sessions...</p>
              ) : adminSessionsQuery.isError ? (
                <p className="type-body text-red-300">{adminSessionsQuery.error?.message || 'Failed to load sessions'}</p>
              ) : adminSessionsQuery.data?.length ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {adminSessionsQuery.data.map((session) => (
                    <div key={session.tokenHash} className="rounded-lg border border-white/10 bg-white/5 p-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="type-body text-white">{session.email}</p>
                        <p className="type-caption text-gray-300 mt-1">Last Used: {new Date(session.lastUsedAt).toLocaleString()}</p>
                        <p className="type-caption text-gray-400 mt-1 line-clamp-1">IP: {session.ip}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        loading={revokeAdminSessionMutation.isPending}
                        onClick={() => revokeAdminSessionMutation.mutate(session.tokenHash)}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="type-body text-gray-300">No active sessions found.</p>
              )}
            </div>

            <div className="panel-card p-5 md:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="type-title">Admin User Management</p>
                <Button variant="panel" size="sm" onClick={() => adminUsersQuery.refetch()}>
                  Refresh Users
                </Button>
              </div>

              <form onSubmit={submitAdminUser} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
                <input
                  type="email"
                  value={adminUserEmail}
                  onChange={(event) => setAdminUserEmail(event.target.value)}
                  className="settings-input type-body focus:outline-none"
                  placeholder="admin@example.com"
                />
                <input
                  type="password"
                  value={adminUserPassword}
                  onChange={(event) => setAdminUserPassword(event.target.value)}
                  className="settings-input type-body focus:outline-none"
                  placeholder="password"
                />
                <select
                  value={adminUserRole}
                  onChange={(event) => setAdminUserRole(event.target.value)}
                  className="settings-input type-body focus:outline-none"
                >
                  <option value="admin">admin</option>
                  <option value="superadmin">superadmin</option>
                </select>
                <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={adminUserActive}
                    onChange={(event) => setAdminUserActive(event.target.checked)}
                  />
                  Active
                </label>

                <Button type="submit" variant="elevated" size="sm" loading={createAdminUserMutation.isPending}>
                  Create
                </Button>
              </form>

              {(createAdminUserMutation.isError || updateAdminUserMutation.isError || deleteAdminUserMutation.isError) && (
                <p className="type-body text-red-300 mb-4">
                  {createAdminUserMutation.error?.message ||
                    updateAdminUserMutation.error?.message ||
                    deleteAdminUserMutation.error?.message ||
                    'Admin user operation failed'}
                </p>
              )}

              {adminUsersQuery.isLoading ? (
                <p className="type-body text-gray-300">Loading admin users...</p>
              ) : adminUsersQuery.isError ? (
                <p className="type-body text-red-300">{adminUsersQuery.error?.message || 'Failed to load admin users'}</p>
              ) : adminUsersQuery.data?.length ? (
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {adminUsersQuery.data.map((user) => (
                    <div key={user.email} className="rounded-lg border border-white/10 bg-white/5 p-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="type-body text-white">{user.email}</p>
                        <p className="type-caption text-gray-300 mt-1">Role: {user.role}</p>
                        <p className="type-caption text-gray-400 mt-1">Status: {user.isActive ? 'Active' : 'Disabled'}</p>
                      </div>

                      <div className="inline-flex items-center gap-2">
                        <Button
                          variant="panel"
                          size="sm"
                          loading={updateAdminUserMutation.isPending}
                          onClick={() =>
                            updateAdminUserMutation.mutate({
                              email: user.email,
                              payload: { isActive: !user.isActive },
                            })
                          }
                        >
                          {user.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="panel"
                          size="sm"
                          loading={updateAdminUserMutation.isPending}
                          onClick={() =>
                            updateAdminUserMutation.mutate({
                              email: user.email,
                              payload: { role: user.role === 'superadmin' ? 'admin' : 'superadmin' },
                            })
                          }
                        >
                          Toggle Role
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={deleteAdminUserMutation.isPending}
                          onClick={() => deleteAdminUserMutation.mutate(user.email)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="type-body text-gray-300">No admin users found.</p>
              )}
            </div>

            <div className="panel-card p-5 md:p-6">
              <p className="type-title mb-3">Security Status</p>

              {securityStatusQuery.isLoading ? (
                <p className="type-body text-gray-300">Loading security status...</p>
              ) : securityStatusQuery.isError ? (
                <p className="type-body text-red-300">{securityStatusQuery.error?.message || 'Failed to load security status'}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="type-caption text-gray-400">Request IP</p>
                    <p className="type-body text-white mt-1">{securityStatusQuery.data?.requestIp || '-'}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="type-caption text-gray-400">CSRF Protection</p>
                    <p className="type-body text-white mt-1">
                      {securityStatusQuery.data?.csrfProtectionEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="type-caption text-gray-400">IP Allowlist</p>
                    <p className="type-body text-white mt-1">
                      {securityStatusQuery.data?.ipAllowlistEnabled
                        ? `Enabled (${securityStatusQuery.data?.allowedIpCount || 0} allowed)`
                        : 'Disabled'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="type-caption text-gray-400">Login Lockout Policy</p>
                    <p className="type-body text-white mt-1">
                      {`${securityStatusQuery.data?.loginProtection?.maxAttempts || 0} attempts, ${Math.round((securityStatusQuery.data?.loginProtection?.lockMs || 0) / 60000)}m lock`}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="type-caption text-gray-400">Tracked Attempt Keys</p>
                    <p className="type-body text-white mt-1">{securityStatusQuery.data?.loginProtection?.trackedKeys ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="type-caption text-gray-400">Currently Locked Keys</p>
                    <p className="type-body text-white mt-1">{securityStatusQuery.data?.loginProtection?.lockedKeys ?? 0}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="panel-card p-5 md:p-6">
              <p className="type-title mb-3">Recent Audit Logs</p>

              {auditLogsQuery.isLoading ? (
                <p className="type-body text-gray-300">Loading logs...</p>
              ) : auditLogsQuery.isError ? (
                <p className="type-body text-red-300">{auditLogsQuery.error?.message || 'Failed to load logs'}</p>
              ) : auditLogsQuery.data?.length ? (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {auditLogsQuery.data.map((log, index) => (
                    <div key={`${log.action}-${log.createdAt}-${index}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="type-body text-white">{log.action}</p>
                        <p className="type-caption text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                      <p className="type-caption text-gray-300 mt-1">{log.email}</p>
                      <p className="type-caption text-gray-400 mt-1">IP: {log.ip}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="type-body text-gray-300">No audit logs yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminShell;
