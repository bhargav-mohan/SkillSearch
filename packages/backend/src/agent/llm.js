import OpenAI from 'openai';

/**
 * Stream an LLM response token by token, calling onChunk for each text delta.
 * Resolves with the full response text when done.
 *
 * @param {object} options
 * @param {string} options.apiKey
 * @param {string} [options.baseURL]
 * @param {string} [options.model]
 * @param {Array<{role: string, content: string}>} options.messages
 * @param {(chunk: string) => void} options.onChunk
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<string>}
 */
export async function callLLM({ apiKey, baseURL, model = 'gpt-4o', messages, onChunk, signal }) {
  const clientOptions = { apiKey };
  if (baseURL) clientOptions.baseURL = baseURL;

  const client = new OpenAI(clientOptions);

  const stream = await client.chat.completions.create(
    {
      model,
      messages,
      temperature: 0.3,
      stream: true,
    },
    { signal }
  );

  let full = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) {
      full += delta;
      onChunk(delta);
    }
  }

  return full;
}
