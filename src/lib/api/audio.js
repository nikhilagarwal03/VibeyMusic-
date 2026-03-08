import { request } from './client';

const selectBestAudioUrl = (links = [], preferredQuality = '320kbps') => {
  if (!Array.isArray(links) || links.length === 0) {
    return null;
  }

  const qualityOrder = ['12kbps', '48kbps', '96kbps', '160kbps', '320kbps'];
  const preferredIndex = Math.max(0, qualityOrder.indexOf(preferredQuality));

  const exact = links.find((link) => link?.quality === preferredQuality)?.url;
  if (exact) return exact;

  const preferredOrder = [];
  for (let index = preferredIndex; index >= 0; index -= 1) {
    preferredOrder.push(qualityOrder[index]);
  }
  for (let index = preferredIndex + 1; index < qualityOrder.length; index += 1) {
    preferredOrder.push(qualityOrder[index]);
  }

  const preferredLink = preferredOrder
    .map((quality) => links.find((link) => link.quality === quality)?.url)
    .find(Boolean);

  return preferredLink || links[links.length - 1]?.url || links[0]?.url || null;
};

export const getBestAudioStreamUrl = async (trackId, fallbackLinks = [], audioQuality = '320kbps') => {
  const fallbackUrl = selectBestAudioUrl(fallbackLinks, audioQuality);

  if (fallbackUrl) {
    return fallbackUrl;
  }

  if (!trackId) {
    return null;
  }

  try {
    const payload = await request(`/songs/${encodeURIComponent(trackId)}`, {}, { timeoutMs: 3500 });
    const song = Array.isArray(payload?.data) ? payload.data[0] : null;
    let apiUrl = selectBestAudioUrl(song?.downloadUrl, audioQuality);

    // Fallback to query route for environments where path-param matching can fail.
    if (!apiUrl) {
      const byIdsPayload = await request('/songs', { ids: trackId }, { timeoutMs: 3500 });
      const byIdsSong = Array.isArray(byIdsPayload?.data) ? byIdsPayload.data[0] : null;
      apiUrl = selectBestAudioUrl(byIdsSong?.downloadUrl, audioQuality);
    }

    return apiUrl || null;
  } catch {
    try {
      const byIdsPayload = await request('/songs', { ids: trackId }, { timeoutMs: 3500 });
      const byIdsSong = Array.isArray(byIdsPayload?.data) ? byIdsPayload.data[0] : null;
      return selectBestAudioUrl(byIdsSong?.downloadUrl, audioQuality);
    } catch {
      return null;
    }
  }
};
