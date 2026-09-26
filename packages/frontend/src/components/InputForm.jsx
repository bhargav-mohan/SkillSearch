import { useState } from 'react';
import { generateSkills } from '../api/generate.js';

const EXAMPLES = [
  'A REST API for a todo app using Node.js and PostgreSQL, with JWT authentication and role-based access control.',
  'A real-time chat application using React, Socket.io, and Redis for session management.',
  'A mobile-first e-commerce storefront built with Next.js, Stripe payments, and a Headless CMS.',
  'A CLI tool in Python that scrapes job listings, filters by keywords, and emails a daily digest.',
  'A data pipeline that ingests CSV files into BigQuery, transforms them with dbt, and visualises results in Looker.',
];

const MAX_CHARS = 2000;

export default function InputForm({ initialDescription = '', onGenerate, onError, onLoading, onChunk }) {
  const [description, setDescription] = useState(initialDescription);
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [model, setModel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function applyExample(text) {
    setDescription(text);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed || submitting) return;

    const ac = new AbortController();
    setSubmitting(true);
    onLoading(ac);

    try {
      const skills = await generateSkills({
        description: trimmed,
        apiKey: apiKey.trim() || undefined,
        baseURL: baseURL.trim() || undefined,
        model: model.trim() || undefined,
        onChunk,
        signal: ac.signal,
      });
      onGenerate(skills, trimmed);
    } catch (err) {
      if (err.name === 'AbortError') return; // user cancelled — App.jsx handles view
      onError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const charCount = description.length;
  const overLimit = charCount > MAX_CHARS;

  return (
    <form className="input-form" onSubmit={handleSubmit}>
      <div className="form-label-row">
        <label className="form-label" htmlFor="description">
          Describe your project
        </label>
        <span className={`char-counter${overLimit ? ' char-counter--over' : ''}`}>
          {charCount}/{MAX_CHARS}
        </span>
      </div>

      <textarea
        id="description"
        className="form-textarea"
        placeholder="e.g. A REST API for a todo app using Node.js and PostgreSQL, with JWT authentication and role-based access control."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={6}
        maxLength={MAX_CHARS}
        required
        disabled={submitting}
      />

      <div className="examples-row">
        <span className="examples-label">Try an example:</span>
        <div className="examples-list">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              className="btn-example"
              onClick={() => applyExample(ex)}
              disabled={submitting}
            >
              {ex.slice(0, 48)}…
            </button>
          ))}
        </div>
      </div>

      <div className="config-toggle">
        <button
          type="button"
          className="btn-text"
          onClick={() => setShowConfig((v) => !v)}
          disabled={submitting}
        >
          {showConfig ? '▲ Hide LLM Config' : '▼ LLM Config (optional)'}
        </button>
      </div>

      {showConfig && (
        <div className="config-section">
          <div className="form-group">
            <label className="form-label-sm" htmlFor="apiKey">
              API Key
              <span className="form-hint"> — overrides the server .env key for this session</span>
            </label>
            <input
              id="apiKey"
              className="form-input"
              type="password"
              placeholder="sk-…"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={submitting}
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label className="form-label-sm" htmlFor="baseURL">
              Base URL
              <span className="form-hint"> — for OpenAI-compatible providers (e.g. Ollama)</span>
            </label>
            <input
              id="baseURL"
              className="form-input"
              type="url"
              placeholder="http://localhost:11434/v1"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="form-group">
            <label className="form-label-sm" htmlFor="model">
              Model
              <span className="form-hint"> — default: gpt-4o</span>
            </label>
            <input
              id="model"
              className="form-input"
              type="text"
              placeholder="gpt-4o"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        className="btn-primary"
        disabled={!description.trim() || overLimit || submitting}
      >
        {submitting ? 'Generating…' : 'Generate Skills'}
      </button>
    </form>
  );
}
