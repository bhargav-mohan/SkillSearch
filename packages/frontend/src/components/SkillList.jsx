import { useEffect, useRef } from 'react';

export default function SkillList({ skills, selectedIndex, onSelect }) {
  const listRef = useRef(null);

  // Keyboard navigation: arrow keys move selection, Enter/Space select
  useEffect(() => {
    function handleKey(e) {
      if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
      // Only handle if focus is inside the list
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
              {skill.type === 'existing' ? 'Existing' : 'Generated'}
            </span>
          </div>
          <span className="skill-item-filename">
            {skill.type === 'generated' ? skill.filename : skill.url}
          </span>
        </li>
      ))}
    </ul>
  );
}
