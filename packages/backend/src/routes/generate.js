import { Router } from 'express';
import { callLLM } from '../agent/llm.js';
import { buildSystemPrompt, buildUserPrompt } from '../agent/prompt.js';

const router = Router();

// Sanitise a filename so it can't escape a ZIP archive
function safeFilename(name) {
  return name.replace(/[^a-z0-9._-]/gi, '-').replace(/\.{2,}/g, '-');
}

// Parse and validate the raw LLM JSON text
function parseSkills(rawText) {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const skills = JSON.parse(cleaned);
  if (!Array.isArray(skills)) throw new Error('Response is not a JSON array');
  if (skills.length === 0) throw new Error('No skills were returned. Try a more detailed project description.');
  if (skills.length > 15) skills.splice(15); // cap at 15

  for (const s of skills) {
    if (!s.name) throw new Error('Each skill must have a name field');
    if (s.type === 'existing') {
      if (!s.description || !s.url) {
        throw new Error(`Existing skill "${s.name}" must have description and url fields`);
      }
    } else if (s.type === 'generated') {
      if (!s.filename || !s.content) {
        throw new Error(`Generated skill "${s.name}" must have filename and content fields`);
      }
      // Sanitise filename to prevent path traversal in ZIP
      s.filename = safeFilename(s.filename);
    } else {
      throw new Error(`Skill "${s.name}" has unknown type "${s.type}". Expected "existing" or "generated".`);
    }
  }

  return skills;
}

// SSE helper — writes a single SSE event line
function sendEvent(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

router.post('/generate', async (req, res) => {
  const { description, apiKey, baseURL, model } = req.body;

  const trimmedDescription = typeof description === 'string' ? description.trim() : '';
  if (!trimmedDescription) {
    return res.status(400).json({ error: 'description is required' });
  }

  // Validate optional fields
  if (apiKey !== undefined && typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'apiKey must be a string' });
  }
  if (baseURL !== undefined) {
    if (typeof baseURL !== 'string') {
      return res.status(400).json({ error: 'baseURL must be a string' });
    }
    try { new URL(baseURL); } catch {
      return res.status(400).json({ error: 'baseURL must be a valid URL (e.g. http://localhost:11434/v1)' });
    }
  }
  if (model !== undefined && (typeof model !== 'string' || model.trim().length === 0)) {
    return res.status(400).json({ error: 'model must be a non-empty string' });
  }

  const resolvedApiKey = (typeof apiKey === 'string' ? apiKey.trim() : '') || process.env.OPENAI_API_KEY;
  if (!resolvedApiKey) {
    return res.status(400).json({
      error: 'No API key provided. Set OPENAI_API_KEY in the server .env or pass apiKey in the request.',
    });
  }

  // Switch to SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Abort signal tied to client disconnect
  const ac = new AbortController();
  req.on('close', () => ac.abort());

  // 90-second hard timeout
  const timeout = setTimeout(() => {
    ac.abort();
    sendEvent(res, { type: 'error', error: 'Request timed out after 90 seconds. Try a shorter description or a faster model.' });
    res.end();
  }, 90_000);

  let rawText = '';
  try {
    rawText = await callLLM({
      apiKey: resolvedApiKey,
      baseURL: baseURL || undefined,
      model: model || undefined,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(trimmedDescription) },
      ],
      onChunk: (chunk) => sendEvent(res, { type: 'chunk', text: chunk }),
      signal: ac.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      res.end();
      return;
    }
    console.error('LLM call failed:', err.message);
    sendEvent(res, { type: 'error', error: `LLM request failed: ${err.message}` });
    res.end();
    return;
  }

  clearTimeout(timeout);

  let skills;
  try {
    skills = parseSkills(rawText);
  } catch (err) {
    console.error('Failed to parse LLM response:', err.message);
    sendEvent(res, { type: 'error', error: `Failed to parse skill data: ${err.message}` });
    res.end();
    return;
  }

  sendEvent(res, { type: 'skills', skills });
  res.write('data: [DONE]\n\n');
  res.end();
});

export default router;
