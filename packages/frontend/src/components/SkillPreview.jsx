import { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';

// Register only the languages likely to appear in generated skill files
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml'; // covers HTML

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);

// Configure marked with a custom renderer that syntax-highlights code blocks
const renderer = new marked.Renderer();
renderer.code = ({ text, lang }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = language !== 'plaintext'
    ? hljs.highlight(text, { language }).value
    : hljs.highlightAuto(text).value;
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
};

marked.setOptions({ breaks: true, renderer });

// Validate that a URL is safe to link to
function isSafeUrl(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button className="btn-copy" onClick={handleCopy} title="Copy to clipboard">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

export default function SkillPreview({ skill }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (skill?.type === 'generated' && skill.content) {
      const raw = marked.parse(skill.content);
      // Sanitise against XSS — allow only safe HTML, strip scripts/event handlers
      const clean = DOMPurify.sanitize(raw, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
      });
      setHtml(clean);
    } else {
      setHtml('');
    }
  }, [skill]);

  if (!skill) {
    return (
      <div className="skill-preview skill-preview--empty">
        <p>Select a skill from the list to preview its contents.</p>
      </div>
    );
  }

  if (skill.type === 'existing') {
    const safe = isSafeUrl(skill.url);
    return (
      <div className="skill-preview">
        <div className="skill-preview-header">
          <h2 className="skill-preview-title">{skill.name}</h2>
          <span className="skill-badge skill-badge--existing">Existing</span>
        </div>
        <div className="skill-preview-existing">
          <p className="skill-preview-description">{skill.description}</p>
          <div className="skill-preview-link-row">
            <span className="skill-preview-link-label">Resource:</span>
            {safe ? (
              <a
                href={skill.url}
                target="_blank"
                rel="noopener noreferrer"
                className="skill-preview-link"
              >
                {skill.url}
              </a>
            ) : (
              <span className="skill-preview-link skill-preview-link--unsafe" title="URL not linked — unsafe protocol">
                {skill.url}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // generated
  return (
    <div className="skill-preview">
      <div className="skill-preview-header">
        <h2 className="skill-preview-title">{skill.name}</h2>
        <div className="skill-preview-header-meta">
          <code className="skill-preview-filename">{skill.filename}</code>
          <span className="skill-badge skill-badge--generated">Generated</span>
          <CopyButton text={skill.content} />
        </div>
      </div>
      <div
        className="skill-preview-content skill-preview-markdown"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
