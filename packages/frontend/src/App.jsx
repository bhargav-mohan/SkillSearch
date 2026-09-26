import { useState, useEffect, useRef } from 'react';
import InputForm from './components/InputForm.jsx';
import Results from './components/Results.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

const STORAGE_KEY = 'skillsearch_last_session';

export default function App() {
  const [view, setView] = useState('input');
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');
  const [streamText, setStreamText] = useState('');
  const [savedDescription, setSavedDescription] = useState('');
  const abortRef = useRef(null);

  // Restore last session on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved?.skills?.length) {
        setSkills(saved.skills);
        setSavedDescription(saved.description || '');
        setView('results');
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  function handleGenerate(result, description) {
    setSkills(result);
    // Persist session
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ skills: result, description }));
    } catch {
      // ignore storage errors (private mode, quota exceeded)
    }
    setStreamText('');
    setView('results');
  }

  function handleError(msg) {
    setStreamText('');
    setError(msg);
    setView('error');
  }

  function handleCancel() {
    if (abortRef.current) abortRef.current.abort();
    setStreamText('');
    setView('input');
  }

  function handleReset() {
    setSkills([]);
    setError('');
    setStreamText('');
    setSavedDescription('');
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setView('input');
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <div className="app-header-inner">
            <div>
              <h1>SkillSearch</h1>
              <p className="app-tagline">Generate the skills your AI coding agent needs to build your project.</p>
            </div>
            {view === 'results' && (
              <button className="btn-text header-reset" onClick={handleReset}>New project</button>
            )}
          </div>
        </header>

        <main className="app-main">
          {view === 'input' && (
            <InputForm
              initialDescription={savedDescription}
              onGenerate={handleGenerate}
              onError={handleError}
              onLoading={(abortController) => {
                abortRef.current = abortController;
                setStreamText('');
                setView('loading');
              }}
              onChunk={(chunk) => setStreamText((t) => t + chunk)}
            />
          )}

          {view === 'loading' && (
            <div className="loading-state">
              <div className="loading-header">
                <div className="spinner" />
                <span>Generating skills…</span>
                <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
              </div>
              {streamText && (
                <pre className="stream-preview">{streamText}</pre>
              )}
            </div>
          )}

          {view === 'results' && (
            <Results skills={skills} onReset={handleReset} />
          )}

          {view === 'error' && (
            <div className="error-state">
              <h2>{error.startsWith('Too many requests') ? 'Rate limit reached' : 'Something went wrong'}</h2>
              <p className="error-message">{error}</p>
              <button className="btn-primary" onClick={handleReset}>Try Again</button>
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
