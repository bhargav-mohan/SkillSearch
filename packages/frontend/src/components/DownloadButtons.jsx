import JSZip from 'jszip';

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
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
    '# SkillSearch — Generated Skills',
    '',
    `Generated on ${new Date().toUTCString()}`,
    '',
  ];

  if (generated.length > 0) {
    lines.push('## Generated Skills', '');
    lines.push('The following skill files are included in this ZIP:', '');
    for (const s of generated) {
      lines.push(`- **${s.name}** — \`${s.filename}\``);
    }
    lines.push('');
    lines.push('Place these \`.md\` files in your project and point your AI coding agent to them.');
    lines.push('');
  }

  if (existing.length > 0) {
    lines.push('## Existing Skills (Links)', '');
    lines.push('These skills are covered by existing public resources:', '');
    for (const s of existing) {
      lines.push(`### ${s.name}`, '');
      lines.push(s.description, '');
      lines.push(`**Resource:** ${s.url}`, '');
    }
  }

  return lines.join('\n');
}

export default function DownloadButtons({ skills, selectedSkill }) {
  const generatedSkills = skills.filter((s) => s.type === 'generated');

  async function handleDownloadAll() {
    const zip = new JSZip();
    for (const skill of generatedSkills) {
      zip.file(skill.filename, skill.content);
    }
    zip.file('README.md', buildZipReadme(skills));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    a.download = `skills-${ts}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const canDownloadSelected = selectedSkill && selectedSkill.type === 'generated';

  return (
    <div className="download-buttons">
      {canDownloadSelected && (
        <button
          className="btn-secondary"
          onClick={() => downloadFile(selectedSkill.filename, selectedSkill.content)}
        >
          Download {selectedSkill.filename}
        </button>
      )}
      {generatedSkills.length > 0 && (
        <button className="btn-primary" onClick={handleDownloadAll}>
          Download {generatedSkills.length} Generated as ZIP
        </button>
      )}
    </div>
  );
}
