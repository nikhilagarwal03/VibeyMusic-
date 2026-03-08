export const decodeHtmlEntities = (value) => {
  if (typeof value !== 'string' || !value.includes('&')) return value;

  let decoded = value;
  let previous = '';
  let iterations = 0;

  while (decoded !== previous && iterations < 4) {
    previous = decoded;
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&quot;?/gi, '"')
      .replace(/&#34;?/g, '"')
      .replace(/&#x22;/gi, '"')
      .replace(/&#39;?/g, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&apos;?/gi, "'")
      .replace(/&lt;?/gi, '<')
      .replace(/&gt;?/gi, '>');
    iterations += 1;
  }

  return decoded;
};

const normalizeCompareText = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/&(quot|amp|apos|lt|gt);?/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(quot|amp|apos|lt|gt)\b/g, ' ')
    .trim();

const collapseRepeatedPrefix = (value) => {
  if (typeof value !== 'string') return value;

  const clean = value.replace(/\s+/g, ' ').trim();
  const words = clean.split(' ');

  if (words.length < 6) return clean;

  for (let index = Math.floor(words.length / 2); index >= 3; index -= 1) {
    const left = words.slice(0, index).join(' ');
    const right = words.slice(index).join(' ');

    if (normalizeCompareText(right).startsWith(normalizeCompareText(left))) {
      return left;
    }
  }

  return clean;
};

const collapseImmediateDuplicateChunks = (value) => {
  if (typeof value !== 'string') return value;

  let words = value.replace(/\s+/g, ' ').trim().split(' ');
  if (words.length < 6) return value.replace(/\s+/g, ' ').trim();

  let changed = true;
  while (changed) {
    changed = false;

    for (let start = 0; start < words.length - 5; start += 1) {
      const maxChunk = Math.floor((words.length - start) / 2);

      for (let size = maxChunk; size >= 3; size -= 1) {
        const left = words.slice(start, start + size).join(' ');
        const right = words.slice(start + size, start + size * 2).join(' ');

        const leftKey = normalizeCompareText(left);
        const rightKey = normalizeCompareText(right);

        if (!leftKey || !rightKey) continue;

        if (leftKey === rightKey || rightKey.startsWith(leftKey) || leftKey.startsWith(rightKey)) {
          words = [...words.slice(0, start + size), ...words.slice(start + size * 2)];
          changed = true;
          break;
        }
      }

      if (changed) break;
    }
  }

  return words.join(' ').trim();
};

export const sanitizeDisplayText = (value) =>
  collapseImmediateDuplicateChunks(collapseRepeatedPrefix(decodeHtmlEntities(value)));

export const removeTitlePrefixFromArtist = (title, artist) => {
  const cleanTitle = sanitizeDisplayText(title || '');
  let cleanArtist = sanitizeDisplayText(artist || '');

  const fromTokenIndex = cleanArtist.toLowerCase().lastIndexOf('(from');
  if (fromTokenIndex !== -1) {
    const closingIndex = cleanArtist.indexOf(')', fromTokenIndex);
    if (closingIndex !== -1) {
      const trailing = cleanArtist
        .slice(closingIndex + 1)
        .trim()
        .replace(/^[-,:;|•)\]"']+\s*/g, '');

      if (trailing.length > 0) {
        cleanArtist = trailing;
      }
    }
  }

  const titleKey = normalizeCompareText(cleanTitle);
  if (!titleKey) return cleanArtist;

  for (let index = 0; index < 4; index += 1) {
    const artistKey = normalizeCompareText(cleanArtist);
    if (!artistKey.startsWith(titleKey)) break;

    const stripped = cleanArtist.slice(cleanTitle.length).trim().replace(/^[-,:;|•)\]"']+\s*/g, '');
    if (!stripped || stripped === cleanArtist) break;
    cleanArtist = stripped;
  }

  return cleanArtist;
};
