import { useEffect, useRef } from 'react';

function badgeLabel(type) {
  return type === 'existing' ? 'Guide' : 'File';
}

export default function SkillList({ skills, selectedIndex, onSelect }) {
  const listRef = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
      if (!listRef.current?.contains(document.activeElement)) return;
      e.preventDefault();
      if (e.key === 'ArrowDown') onSelect(Math.min(selectedIndex + 1, skills.length - 1));
      if (e.key === 'ArrowUp') onSelect(Math.max(selectedIndex - 1, 0));
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex, skills.length, onSelect]);

  return (
    <ul className="skill-list" ref={listRef} role="listbox" aria-label="Skills">
      {skills.map((skill, i) => (
        <li
          key={skill.type === 'generated' ? skill.filename : `existing-${i}`}
          role="option"
          aria-selected={i === selectedIndex}
          tabIndex={i === selectedIndex ? 0 : -1}
          className={`skill-item${i === selectedIndex ? ' skill-item--active' : ''}`}
          onClick={() => onSelect(i)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(i); }}
        >
          <div className="skill-item-header">
            <span className="skill-item-name">{skill.name}</span>
            <span className={`skill-badge skill-badge--${skill.type}`}>
              {badgeLabel(skill.type)}
            </span>
          </div>
          <span className="skill-item-filename">
            {skill.type === 'generated' ? skill.filename : 'Open the existing guide'}
          </span>
        </li>
      ))}
    </ul>
  );
}
