import { useState, useEffect, useRef } from 'react';
import InputForm from './components/InputForm.jsx';
import Results from './components/Results.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

const STORAGE_KEY = 'skillsearch_last_session';

function friendlyError(msg) {
  if (!msg) return { title: 'Something went wrong', body: 'Please try again.' };
  if (msg.startsWith('Too many requests')) {
    return {
      title: 'Give it a moment',
      body: 'You’ve asked a few times already. Wait a couple of minutes, then try again.',
    };
  }
  if (msg.includes('No API key')) {
    return {
      title: 'We need a model key',
      body: 'Add an API key under “Using your own model?”, or ask whoever set this up to put one on the server.',
    };
  }
  if (msg.includes('timed out')) {
    return {
      title: 'That took too long',
      body: 'Try a shorter description, or pick a faster model under advanced settings.',
    };
  }
  if (msg.includes('Failed to parse')) {
    return {
      title: 'We couldn’t read the reply',
      body: 'The model sent something we couldn’t use. Trying again usually fixes it.',
    };
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return {
      title: 'We couldn’t reach the server',
      body: 'Check that SkillSearch is running, then try again.',
    };
  }
  return { title: 'Something went wrong', body: msg };
}

export default function App() {
  const [view, setView] = useState('input');
  const [skills, setSkills] = useState([]);
  const [heard, setHeard] = useState('');
  const [error, setError] = useState('');
  const [savedDescription, setSavedDescription] = useState('');
  const [lastDescription, setLastDescription] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved?.skills?.length) {
        setSkills(saved.skills);
        setHeard(saved.heard || '');
        setSavedDescription(saved.description || '');
        setLastDescription(saved.description || '');
        setView('results');
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  function persist(nextSkills, nextHeard, description) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ skills: nextSkills, heard: nextHeard, description })
      );
    } catch {
      // private mode, quota exceeded
    }
  }

  function handleGenerate(result, description) {
    const nextSkills = result.skills || [];
    const nextHeard = result.heard || '';
    setSkills(nextSkills);
    setHeard(nextHeard);
    setLastDescription(description);
    setSavedDescription(description);
    persist(nextSkills, nextHeard, description);
    setView('results');
  }

  function handleError(msg) {
    setError(msg);
    setView('error');
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.abort();
    setView('input');
  }

  function handleRetry() {
    setError('');
    setView('input');
  }

  function handleEdit() {
    setView('input');
  }

  function handleReset() {
    setSkills([]);
    setHeard('');
    setError('');
    setSavedDescription('');
    setLastDescription('');
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setView('input');
  }

  const err = friendlyError(error);

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <div className="app-header-inner">
            <h1 className="brand">
              <span className="brand-mark" aria-hidden="true" />
              <span className="brand-name">SkillSearch</span>
            </h1>
            {view === 'results' && (
              <button type="button" className="btn-text header-reset" onClick={handleReset}>
                New project
              </button>
            )}
          </div>
        </header>

        <main className="app-main">
          {view === 'input' && (
            <InputForm
              initialDescription={savedDescription || lastDescription}
              onGenerate={handleGenerate}
              onError={handleError}
              onLoading={(abortController, description) => {
                abortRef.current = abortController;
                setLastDescription(description);
                setView('loading');
              }}
            />
          )}

          {view === 'loading' && (
            <LoadingState onCancel={handleCancel} />
          )}

          {view === 'results' && (
            <Results
              skills={skills}
              heard={heard}
              description={savedDescription || lastDescription}
              onEdit={handleEdit}
            />
          )}

          {view === 'error' && (
            <div className="error-state">
              <p className="error-kicker">Sorry about this</p>
              <h2>{err.title}</h2>
              <p className="error-body">{err.body}</p>
              {err.body !== error && error && (
                <p className="error-message">{error}</p>
              )}
              <div className="error-actions">
                <button type="button" className="btn-primary" onClick={handleRetry}>
                  Try again
                </button>
                <button type="button" className="btn-text" onClick={handleReset}>
                  Start over
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
