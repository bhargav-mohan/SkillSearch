import { useState } from 'react';
import JSZip from 'jszip';

function downloadFile(filename, content, type = 'text/markdown;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildZipReadme(skills) {
  const generated = skills.filter((s) => s.type === 'generated');
  const existing = skills.filter((s) => s.type === 'existing');

  const lines = [
    '# Your skill pack',
    '',
    `Put together on ${new Date().toUTCString()}`,
    '',
    'Drop the `.md` files into your project — or your AI coding agent’s skills folder — and tell the agent to use them.',
    'This zip also includes `skills.json` if you want the same pack in a structured format.',
    '',
  ];

  if (generated.length > 0) {
    lines.push('## Written for this project', '');
    for (const s of generated) {
      lines.push(`- **${s.name}** — \`${s.filename}\``);
    }
    lines.push('');
  }

  if (existing.length > 0) {
    lines.push('## Guides that already exist', '');
    for (const s of existing) {
      lines.push(`### ${s.name}`, '');
      lines.push(s.description, '');
      lines.push(`${s.url}`, '');
    }
  }

  return lines.join('\n');
}

function buildAllMarkdown(skills) {
  const parts = ['# Skill pack', ''];
  for (const skill of skills) {
    if (skill.type === 'generated') {
      parts.push(skill.content, '', '---', '');
    } else {
      parts.push(`# ${skill.name}`, '', skill.description, '', skill.url, '', '---', '');
    }
  }
  return parts.join('\n');
}

export default function DownloadButtons({ skills, selectedSkill }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const generatedSkills = skills.filter((s) => s.type === 'generated');

  async function handleDownloadAll() {
    const zip = new JSZip();
    for (const skill of generatedSkills) {
      zip.file(skill.filename, skill.content);
    }
    zip.file('README.md', buildZipReadme(skills));
    zip.file('skills.json', JSON.stringify(skills, null, 2));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skills-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopyAll() {
    const text = buildAllMarkdown(skills);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  const canDownloadSelected = selectedSkill && selectedSkill.type === 'generated';

  return (
    <div className="download-buttons">
      {canDownloadSelected && (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => downloadFile(selectedSkill.filename, selectedSkill.content)}
        >
          Download this .md
        </button>
      )}
      {generatedSkills.length > 0 && (
        <button type="button" className="btn-primary" onClick={handleDownloadAll}>
          Download all as zip
        </button>
      )}
      {skills.length > 0 && (
        <button type="button" className="btn-text" onClick={handleCopyAll}>
          {copiedAll ? 'Copied the whole pack' : 'Copy all as markdown'}
        </button>
      )}
      {skills.length > 0 && (
        <button
          type="button"
          className="btn-text"
          onClick={() => downloadFile('skills.json', JSON.stringify(skills, null, 2), 'application/json')}
        >
          Download JSON
        </button>
      )}
    </div>
  );
}
