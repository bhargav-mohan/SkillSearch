/**
 * Stream POST /api/generate via SSE.
 *
 * @param {object} params
 * @param {string} params.description
 * @param {string} [params.apiKey]
 * @param {string} [params.baseURL]
 * @param {string} [params.model]
 * @param {(chunk: string) => void} params.onChunk  - called with each raw text delta
 * @param {AbortSignal} params.signal
 * @returns {Promise<Array>} Resolves with the skills array when complete
 */
export async function generateSkills({ description, apiKey, baseURL, model, onChunk, signal }) {
  const body = { description };
  if (apiKey) body.apiKey = apiKey;
  if (baseURL) body.baseURL = baseURL;
  if (model) body.model = model;

  // In production with a separate backend domain, VITE_API_URL is injected at build time
  const base = typeof __API_URL__ !== 'undefined' && __API_URL__ ? __API_URL__ : '';
  const res = await fetch(`${base}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  // Pre-SSE errors (e.g. 400, 429) come back as plain JSON
  if (!res.ok) {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      throw new Error(data.error || `Server error ${res.status}`);
    }
    throw new Error(`Server error ${res.status}`);
  }

  // Read the SSE stream
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  let skills = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process all complete SSE lines in the buffer
    const lines = buffer.split('\n');
    buffer = lines.pop(); // last element is the incomplete line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') return skills;

      let event;
      try {
        event = JSON.parse(payload);
      } catch {
        continue;
      }

      if (event.type === 'error') {
        throw new Error(event.error);
      }
      if (event.type === 'chunk' && onChunk) {
        onChunk(event.text);
      }
      if (event.type === 'skills') {
        skills = event.skills;
      }
    }
  }

  // Stream ended cleanly — return whatever we collected
  if (skills) return skills;
  throw new Error('Stream ended without returning skills. The LLM may have failed or the connection was lost.');
}
