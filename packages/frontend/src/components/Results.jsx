import { useState, useEffect, useRef } from 'react';
import SkillList from './SkillList.jsx';
import SkillPreview from './SkillPreview.jsx';
import DownloadButtons from './DownloadButtons.jsx';

export default function Results({ skills, onReset }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedSkill = skills[selectedIndex] || null;
  const listRef = useRef(null);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('.skill-item--active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const generatedCount = skills.filter((s) => s.type === 'generated').length;
  const existingCount = skills.filter((s) => s.type === 'existing').length;

  return (
    <div className="results">
      <div className="results-toolbar">
        <span className="results-count">
          {skills.length} skill{skills.length !== 1 ? 's' : ''}
          {' — '}
          <span className="results-count-generated">{generatedCount} generated</span>
          {existingCount > 0 && (
            <>, <span className="results-count-existing">{existingCount} existing</span></>
          )}
        </span>
        <div className="results-actions">
          <DownloadButtons skills={skills} selectedSkill={selectedSkill} />
          <button className="btn-text" onClick={onReset}>← Start Over</button>
        </div>
      </div>

      <div className="results-layout">
        <aside className="results-sidebar" ref={listRef}>
          <SkillList
            skills={skills}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        </aside>
        <section className="results-content">
          <SkillPreview skill={selectedSkill} />
        </section>
      </div>
    </div>
  );
}
