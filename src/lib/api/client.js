const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const request = async (path, params = {}, options = {}) => {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const timeoutMs = Number.isFinite(options?.timeoutMs) ? Math.max(0, options.timeoutMs) : 0;
  const hasExternalSignal = Boolean(options?.signal);
  const controller = !hasExternalSignal && timeoutMs > 0 ? new AbortController() : null;
  const timeoutId = controller && timeoutMs > 0
    ? window.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  let response;
  try {
    response = await fetch(url.toString(), {
      signal: options?.signal || controller?.signal
    });
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `API request failed with status ${response.status}`);
  }

  return payload;
};
