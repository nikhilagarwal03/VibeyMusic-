import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminLogin,
  adminLogout,
  adminRefresh,
  createAdminUser,
  createAdminFeatureFlag,
  deleteAdminUser,
  deleteAdminFeatureFlag,
  deleteAdminSystemSetting,
  fetchAdminCsrf,
  getAdminSessions,
  getAdminUsers,
  getAdmin2faStatus,
  getAdminAuditLogs,
  getAdminFeatureFlags,
  getAdminHealth,
  getAdminSecurityStatus,
  getAdminUsageSummary,
  getAdminSystemSettings,
  revokeAdminSession,
  upsertAdminSystemSetting,
  updateAdminUser,
  updateAdminFeatureFlag,
} from '../api/adminClient';

const useAdminAuth = () => {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const isAuthenticated = useMemo(() => Boolean(accessToken), [accessToken]);

  const updateTokens = (nextTokens) => {
    setAccessToken(nextTokens?.accessToken || '');
  };

  const clearAuth = () => {
    setAccessToken('');
  };

  useEffect(() => {
    let isCancelled = false;

    const bootstrap = async () => {
      try {
        await fetchAdminCsrf();
        const refreshed = await adminRefresh();
        if (!isCancelled) {
          setAccessToken(refreshed?.accessToken || '');
        }
      } catch {
        if (!isCancelled) {
          setAccessToken('');
        }
      } finally {
        if (!isCancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      isCancelled = true;
    };
  }, []);

  const loginMutation = useMutation({
    mutationFn: ({ email, password, otp }) => adminLogin({ email, password, otp }),
    onSuccess: (nextTokens) => {
      updateTokens(nextTokens);
    }
  });

  const twoFactorStatusQuery = useQuery({
    queryKey: ['admin-2fa-status'],
    queryFn: getAdmin2faStatus,
    retry: false,
    staleTime: 60_000,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await adminLogout();
    },
    onSettled: () => {
      clearAuth();
    }
  });

  const healthQuery = useQuery({
    queryKey: ['admin-health'],
    queryFn: () =>
      getAdminHealth({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
      }),
    enabled: isAuthenticated && !isBootstrapping,
    retry: false,
    refetchInterval: 30_000,
  });

  const auditLogsQuery = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () =>
      getAdminAuditLogs({
        accessToken,
        limit: 50,
        onAccessTokenRefresh: setAccessToken,
      }),
    enabled: isAuthenticated && !isBootstrapping,
    retry: false,
    staleTime: 20_000,
  });

  const securityStatusQuery = useQuery({
    queryKey: ['admin-security-status'],
    queryFn: () =>
      getAdminSecurityStatus({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
      }),
    enabled: isAuthenticated && !isBootstrapping,
    retry: false,
    staleTime: 20_000,
  });

  const usageSummaryQuery = useQuery({
    queryKey: ['admin-usage-summary'],
    queryFn: () =>
      getAdminUsageSummary({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
      }),
    enabled: isAuthenticated && !isBootstrapping,
    retry: false,
    staleTime: 20_000,
  });

  const featureFlagsQuery = useQuery({
    queryKey: ['admin-feature-flags'],
    queryFn: () =>
      getAdminFeatureFlags({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
      }),
    enabled: isAuthenticated && !isBootstrapping,
    retry: false,
    staleTime: 20_000,
  });

  const createFeatureFlagMutation = useMutation({
    mutationFn: (flag) =>
      createAdminFeatureFlag({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
        flag,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });

  const updateFeatureFlagMutation = useMutation({
    mutationFn: ({ key, patch }) =>
      updateAdminFeatureFlag({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
        key,
        patch,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });

  const deleteFeatureFlagMutation = useMutation({
    mutationFn: (key) =>
      deleteAdminFeatureFlag({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
        key,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });

  const systemSettingsQuery = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: () =>
      getAdminSystemSettings({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
      }),
    enabled: isAuthenticated && !isBootstrapping,
    retry: false,
    staleTime: 20_000,
  });

  const upsertSystemSettingMutation = useMutation({
    mutationFn: ({ key, value, description }) =>
      upsertAdminSystemSetting({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
        key,
        value,
        description,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });

  const deleteSystemSettingMutation = useMutation({
    mutationFn: (key) =>
      deleteAdminSystemSetting({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
        key,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });

  const adminSessionsQuery = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: () =>
      getAdminSessions({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
      }),
    enabled: isAuthenticated && !isBootstrapping,
    retry: false,
    staleTime: 20_000,
  });

  const revokeAdminSessionMutation = useMutation({
    mutationFn: (tokenHash) =>
      revokeAdminSession({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
        tokenHash,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-usage-summary'] });
    },
  });

  const adminUsersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () =>
      getAdminUsers({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
      }),
    enabled: isAuthenticated && !isBootstrapping,
    retry: false,
    staleTime: 20_000,
  });

  const createAdminUserMutation = useMutation({
    mutationFn: (payload) =>
      createAdminUser({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
        payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });

  const updateAdminUserMutation = useMutation({
    mutationFn: ({ email, payload }) =>
      updateAdminUser({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
        email,
        payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });

  const deleteAdminUserMutation = useMutation({
    mutationFn: (email) =>
      deleteAdminUser({
        accessToken,
        onAccessTokenRefresh: setAccessToken,
        email,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
    },
  });

  return {
    isAuthenticated,
    accessToken,
    isBootstrapping,
    updateTokens,
    clearAuth,
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
  };
};

export default useAdminAuth;
