import { useState, useEffect, useRef } from 'react';
import SkillList from './SkillList.jsx';
import SkillPreview from './SkillPreview.jsx';
import DownloadButtons from './DownloadButtons.jsx';

export default function Results({ skills, heard, description, onEdit }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedSkill = skills[selectedIndex] || null;
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('.skill-item--active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const writtenCount = skills.filter((s) => s.type === 'generated').length;
  const existingCount = skills.filter((s) => s.type === 'existing').length;

  return (
    <div className="results">
      <section className="results-intro">
        <p className="results-kicker">Here’s what we heard</p>
        <h2 className="results-heard">
          {heard || 'We put together the skills this project needs.'}
        </h2>
        {description && (
          <blockquote className="results-quote">
            {description}
          </blockquote>
        )}
        <p className="results-count">
          {skills.length} skill{skills.length !== 1 ? 's' : ''}
          {writtenCount > 0 && (
            <> — <span className="results-count-generated">{writtenCount} written for you</span></>
          )}
          {existingCount > 0 && (
            <>{writtenCount > 0 ? ', ' : ' — '}<span className="results-count-existing">{existingCount} already out there</span></>
          )}
        </p>
        <p className="results-howto">
          Written skills are <code>.md</code> files you can download, copy, or take as a zip
          (a JSON copy is in there too). Put them where your agent can see them.
          Guides are links we found so we didn’t rewrite them.
        </p>
      </section>

      <div className="results-toolbar">
        <DownloadButtons skills={skills} selectedSkill={selectedSkill} />
        <div className="results-actions">
          <button type="button" className="btn-text" onClick={onEdit}>
            Change what you wrote
          </button>
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
