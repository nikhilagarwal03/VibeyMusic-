import {
  AdminFeatureFlagSchema,
  AdminHealthSchema,
  AdminSecurityStatusSchema,
  AdminSystemSettingSchema,
  AdminTokenDataSchema,
  AdminUsageSummarySchema,
} from '../../../../packages/contracts/src/admin.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
let csrfTokenCache = '';

const buildUrl = (path) => `${API_BASE_URL}${path}`;

const parseApiError = (payload, fallback) => {
  if (payload?.error?.message) return payload.error.message;
  if (payload?.message) return payload.message;
  return fallback;
};

const parseWithSchema = (schema, payload, fallbackMessage) => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new Error(fallbackMessage);
  }

  return result.data;
};

const rawRequest = async (path, { method = 'GET', body, accessToken, csrfToken } = {}) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken;
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  });

  const payload = await response.json().catch(() => ({}));

  return {
    ok: response.ok && payload?.success !== false,
    status: response.status,
    payload
  };
};

export const fetchAdminCsrf = async () => {
  const result = await rawRequest('/admin/auth/csrf', { method: 'GET' });

  if (!result.ok) {
    throw new Error(parseApiError(result.payload, 'Failed to initialize admin CSRF token'));
  }

  csrfTokenCache = result.payload?.data?.csrfToken || '';
  return csrfTokenCache;
};

const ensureCsrfToken = async () => {
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  return fetchAdminCsrf();
};

const withCsrf = async (requestFactory) => {
  const csrfToken = await ensureCsrfToken();
  const response = await requestFactory(csrfToken);

  if (response.status !== 403) {
    return response;
  }

  const refreshedToken = await fetchAdminCsrf();
  return requestFactory(refreshedToken);
};

export const adminLogin = async ({ email, password, otp }) => {
  const result = await withCsrf((csrfToken) =>
    rawRequest('/admin/auth/login', {
      method: 'POST',
      body: { email, password, otp },
      csrfToken
    })
  );

  if (!result.ok) {
    throw new Error(parseApiError(result.payload, 'Admin login failed'));
  }

  return parseWithSchema(
    AdminTokenDataSchema,
    result.payload.data,
    'Admin login response validation failed'
  );
};

export const getAdmin2faStatus = async () => {
  const result = await rawRequest('/admin/auth/2fa/status', { method: 'GET' });

  if (!result.ok) {
    throw new Error(parseApiError(result.payload, 'Failed to load admin 2FA status'));
  }

  return result.payload.data;
};

export const adminRefresh = async (refreshToken) => {
  const result = await withCsrf((csrfToken) =>
    rawRequest('/admin/auth/refresh', {
      method: 'POST',
      body: refreshToken ? { refreshToken } : undefined,
      csrfToken
    })
  );

  if (!result.ok) {
    throw new Error(parseApiError(result.payload, 'Admin session refresh failed'));
  }

  return parseWithSchema(
    AdminTokenDataSchema,
    result.payload.data,
    'Admin refresh response validation failed'
  );
};

export const adminLogout = async (refreshToken) => {
  await withCsrf((csrfToken) =>
    rawRequest('/admin/auth/logout', {
      method: 'POST',
      body: refreshToken ? { refreshToken } : undefined,
      csrfToken
    })
  );
};

const requestWithAdminAuth = async ({
  path,
  method = 'GET',
  body,
  accessToken,
  onAccessTokenRefresh,
  includeCsrf = false
}) => {
  const initialCsrfToken = includeCsrf ? await ensureCsrfToken() : undefined;

  const firstAttempt = await rawRequest(path, {
    method,
    body,
    accessToken,
    csrfToken: initialCsrfToken
  });

  if (firstAttempt.ok) {
    return firstAttempt.payload.data;
  }

  if (includeCsrf && firstAttempt.status === 403) {
    const refreshedCsrfToken = await fetchAdminCsrf();
    const csrfRetry = await rawRequest(path, {
      method,
      body,
      accessToken,
      csrfToken: refreshedCsrfToken
    });

    if (csrfRetry.ok) {
      return csrfRetry.payload.data;
    }

    if (csrfRetry.status !== 401) {
      throw new Error(parseApiError(csrfRetry.payload, 'Admin request failed'));
    }
  }

  if (firstAttempt.status !== 401) {
    throw new Error(parseApiError(firstAttempt.payload, 'Admin request failed'));
  }

  const refreshedTokens = await adminRefresh();
  onAccessTokenRefresh?.(refreshedTokens.accessToken || '');

  const retryCsrfToken = includeCsrf ? await ensureCsrfToken() : undefined;

  const secondAttempt = await rawRequest(path, {
    method,
    body,
    accessToken: refreshedTokens.accessToken,
    csrfToken: retryCsrfToken
  });

  if (!secondAttempt.ok) {
    if (includeCsrf && secondAttempt.status === 403) {
      const refreshedCsrfToken = await fetchAdminCsrf();
      const thirdAttempt = await rawRequest(path, {
        method,
        body,
        accessToken: refreshedTokens.accessToken,
        csrfToken: refreshedCsrfToken
      });

      if (thirdAttempt.ok) {
        return thirdAttempt.payload.data;
      }

      throw new Error(parseApiError(thirdAttempt.payload, 'Admin request failed'));
    }

    throw new Error(parseApiError(secondAttempt.payload, 'Admin request failed'));
  }

  return secondAttempt.payload.data;
};

export const getAdminHealth = async ({ accessToken, onAccessTokenRefresh }) =>
  parseWithSchema(
    AdminHealthSchema,
    await requestWithAdminAuth({
      path: '/admin/health',
      method: 'GET',
      accessToken,
      onAccessTokenRefresh
    }),
    'Admin health response validation failed'
  );

export const getAdminAuditLogs = async ({ accessToken, limit = 50, onAccessTokenRefresh }) =>
  requestWithAdminAuth({
    path: `/admin/audit/logs?limit=${encodeURIComponent(String(limit))}`,
    method: 'GET',
    accessToken,
    onAccessTokenRefresh
  });

export const getAdminSecurityStatus = async ({ accessToken, onAccessTokenRefresh }) =>
  parseWithSchema(
    AdminSecurityStatusSchema,
    await requestWithAdminAuth({
      path: '/admin/security/status',
      method: 'GET',
      accessToken,
      onAccessTokenRefresh
    }),
    'Admin security status response validation failed'
  );

export const getAdminUsageSummary = async ({ accessToken, onAccessTokenRefresh }) =>
  parseWithSchema(
    AdminUsageSummarySchema,
    await requestWithAdminAuth({
      path: '/admin/usage/summary',
      method: 'GET',
      accessToken,
      onAccessTokenRefresh
    }),
    'Admin usage summary response validation failed'
  );

export const getAdminFeatureFlags = async ({ accessToken, onAccessTokenRefresh }) =>
  parseWithSchema(
    AdminFeatureFlagSchema.array(),
    await requestWithAdminAuth({
      path: '/admin/feature-flags',
      method: 'GET',
      accessToken,
      onAccessTokenRefresh
    }),
    'Admin feature flags response validation failed'
  );

export const createAdminFeatureFlag = async ({ accessToken, onAccessTokenRefresh, flag }) =>
  requestWithAdminAuth({
    path: '/admin/feature-flags',
    method: 'POST',
    body: flag,
    accessToken,
    onAccessTokenRefresh,
    includeCsrf: true
  });

export const updateAdminFeatureFlag = async ({ accessToken, onAccessTokenRefresh, key, patch }) =>
  requestWithAdminAuth({
    path: `/admin/feature-flags/${encodeURIComponent(key)}`,
    method: 'PATCH',
    body: patch,
    accessToken,
    onAccessTokenRefresh,
    includeCsrf: true
  });

export const deleteAdminFeatureFlag = async ({ accessToken, onAccessTokenRefresh, key }) =>
  requestWithAdminAuth({
    path: `/admin/feature-flags/${encodeURIComponent(key)}`,
    method: 'DELETE',
    accessToken,
    onAccessTokenRefresh,
    includeCsrf: true
  });

export const getAdminSystemSettings = async ({ accessToken, onAccessTokenRefresh }) =>
  parseWithSchema(
    AdminSystemSettingSchema.array(),
    await requestWithAdminAuth({
      path: '/admin/system/settings',
      method: 'GET',
      accessToken,
      onAccessTokenRefresh
    }),
    'Admin system settings response validation failed'
  );

export const upsertAdminSystemSetting = async ({ accessToken, onAccessTokenRefresh, key, value, description }) =>
  requestWithAdminAuth({
    path: `/admin/system/settings/${encodeURIComponent(key)}`,
    method: 'PUT',
    body: { value, description },
    accessToken,
    onAccessTokenRefresh,
    includeCsrf: true
  });

export const deleteAdminSystemSetting = async ({ accessToken, onAccessTokenRefresh, key }) =>
  requestWithAdminAuth({
    path: `/admin/system/settings/${encodeURIComponent(key)}`,
    method: 'DELETE',
    accessToken,
    onAccessTokenRefresh,
    includeCsrf: true
  });

export const getAdminSessions = async ({ accessToken, onAccessTokenRefresh }) =>
  requestWithAdminAuth({
    path: '/admin/sessions',
    method: 'GET',
    accessToken,
    onAccessTokenRefresh,
  });

export const revokeAdminSession = async ({ accessToken, onAccessTokenRefresh, tokenHash }) =>
  requestWithAdminAuth({
    path: `/admin/sessions/${encodeURIComponent(tokenHash)}`,
    method: 'DELETE',
    accessToken,
    onAccessTokenRefresh,
    includeCsrf: true,
  });

export const getAdminUsers = async ({ accessToken, onAccessTokenRefresh }) =>
  requestWithAdminAuth({
    path: '/admin/users',
    method: 'GET',
    accessToken,
    onAccessTokenRefresh,
  });

export const createAdminUser = async ({ accessToken, onAccessTokenRefresh, payload }) =>
  requestWithAdminAuth({
    path: '/admin/users',
    method: 'POST',
    body: payload,
    accessToken,
    onAccessTokenRefresh,
    includeCsrf: true,
  });

export const updateAdminUser = async ({ accessToken, onAccessTokenRefresh, email, payload }) =>
  requestWithAdminAuth({
    path: `/admin/users/${encodeURIComponent(email)}`,
    method: 'PATCH',
    body: payload,
    accessToken,
    onAccessTokenRefresh,
    includeCsrf: true,
  });

export const deleteAdminUser = async ({ accessToken, onAccessTokenRefresh, email }) =>
  requestWithAdminAuth({
    path: `/admin/users/${encodeURIComponent(email)}`,
    method: 'DELETE',
    accessToken,
    onAccessTokenRefresh,
    includeCsrf: true,
  });
