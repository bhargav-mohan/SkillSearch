import { useState } from 'react';
import { generateSkills } from '../api/generate.js';

const EXAMPLES = [
  {
    label: 'Todo API',
    text: 'A REST API for a todo app using Node.js and PostgreSQL, with JWT authentication and role-based access control.',
  },
  {
    label: 'Live chat',
    text: 'A real-time chat application using React, Socket.io, and Redis for session management.',
  },
  {
    label: 'Online shop',
    text: 'A mobile-first e-commerce storefront built with Next.js, Stripe payments, and a Headless CMS.',
  },
  {
    label: 'Job-scraper CLI',
    text: 'A CLI tool in Python that scrapes job listings, filters by keywords, and emails a daily digest.',
  },
  {
    label: 'Data pipeline',
    text: 'A data pipeline that ingests CSV files into BigQuery, transforms them with dbt, and visualises results in Looker.',
  },
];

const MAX_CHARS = 2000;
const WARN_AT = 1800;

export default function InputForm({ initialDescription = '', onGenerate, onError, onLoading }) {
  const [description, setDescription] = useState(initialDescription);
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [model, setModel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed || submitting) return;

    const ac = new AbortController();
    setSubmitting(true);
    onLoading(ac, trimmed);

    try {
      const result = await generateSkills({
        description: trimmed,
        apiKey: apiKey.trim() || undefined,
        baseURL: baseURL.trim() || undefined,
        model: model.trim() || undefined,
        signal: ac.signal,
      });
      onGenerate(result, trimmed);
    } catch (err) {
      if (err.name === 'AbortError') return;
      onError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const charCount = description.length;
  const overLimit = charCount > MAX_CHARS;
  const showCount = charCount >= WARN_AT;

  return (
    <div className="input-page">
      <div className="hero">
        <p className="hero-kicker">For people building with AI coding agents</p>
        <h2 className="hero-title">Tell us what you’re building.</h2>
        <p className="hero-lede">
          We’ll read it, figure out the skills that project needs, and hand them back as
          markdown files you can drop straight into your agent.
        </p>
      </div>

      <form className="input-form" onSubmit={handleSubmit}>
        <div className="form-label-row">
          <label className="form-label" htmlFor="description">
            What are you making?
          </label>
          {showCount && (
            <span className={`char-counter${overLimit ? ' char-counter--over' : ''}`}>
              {charCount}/{MAX_CHARS}
            </span>
          )}
        </div>

        <textarea
          id="description"
          className="form-textarea"
          placeholder="A weekend app, a work tool, a half-formed idea — stack, users, and the parts you’re unsure about all help."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={7}
          maxLength={MAX_CHARS}
          required
          disabled={submitting}
        />

        <div className="examples-row">
          <span className="examples-label">Or start from one of these</span>
          <div className="examples-list">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                className={`btn-example${description === ex.text ? ' btn-example--active' : ''}`}
                onClick={() => setDescription(ex.text)}
                disabled={submitting}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={!description.trim() || overLimit || submitting}
          >
            {submitting ? 'Working on it…' : 'Find the skills I need'}
          </button>
          <button
            type="button"
            className="btn-text"
            onClick={() => setShowConfig((v) => !v)}
            disabled={submitting}
            aria-expanded={showConfig}
          >
            {showConfig ? 'Hide advanced settings' : 'Using your own model?'}
          </button>
        </div>

        {showConfig && (
          <div className="config-section">
            <p className="config-intro">
              Optional. Leave these blank to use the server’s default model.
              Your key stays in this browser tab and is sent only with this request.
            </p>
            <div className="form-group">
              <label className="form-label-sm" htmlFor="apiKey">
                API key
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
                <span className="form-hint"> — any OpenAI-compatible endpoint, like Ollama</span>
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
                <span className="form-hint"> — default is gpt-4o</span>
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
      </form>

      <ol className="how-it-works" aria-label="How it works">
        <li>
          <span className="how-step">1</span>
          <span>Describe the project in your own words</span>
        </li>
        <li>
          <span className="how-step">2</span>
          <span>We find or write the skills it needs</span>
        </li>
        <li>
          <span className="how-step">3</span>
          <span>You take them as <code>.md</code> files, a zip, or a copy</span>
        </li>
      </ol>
    </div>
  );
}
