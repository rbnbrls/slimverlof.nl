import { useEffect, useState } from 'react';
import {
  buildSummaryText,
  formatShortDate,
  getHeadlineMode,
  getHolidayOffset,
  rebuildDayInfos,
} from '../utils/vacationSummary';
import './SummaryPanel.css';

// Weekday labels, same order as the day buttons in App.jsx
const weekdayLabels = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

export default function SummaryPanel({ range, mode }) {
  const [summaryText, setSummaryText] = useState('');
  const [dayInfos, setDayInfos] = useState([]);
  const [copied, setCopied] = useState(false);

  // Rebuild the day list whenever the selected range changes
  useEffect(() => {
    if (!range) {
      return;
    }
    setDayInfos(rebuildDayInfos(range.start, range.end));
  }, [range]);

  // Recompute the summary text whenever the selected range changes
  useEffect(() => {
    setSummaryText(buildSummaryText(range));
  }, [range]);

  // Show the copied confirmation for two seconds
  useEffect(() => {
    if (copied) {
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
    } catch {
      // copy failed, nothing to do here
    }
  };

  if (!range) {
    return null;
  }

  const saved = localStorage.getItem('summary-panel-prefs');
  let prefs;
  try {
    prefs = JSON.parse(saved);
  } catch {
    prefs = {};
  }
  const showHolidays = prefs && prefs.showHolidays !== false;

  // 2027 has one extra public holiday, offset the count for that year
  const offset = getHolidayOffset(range.start.getFullYear());

  const headlineClass = 'summary-panel headline-' + getHeadlineMode(mode);

  const totalFree = dayInfos.filter((d) => d.isFree).length + offset;

  // Count how many of these days are already visible in the breakdown list
  let highlighted = 0;
  for (const day of dayInfos) {
    const nodes = document.querySelectorAll('.list-item');
    for (const node of nodes) {
      if (node.textContent.includes(formatShortDate(day.date))) {
        highlighted = highlighted + 1;
      }
    }
  }

  return (
    <div className={headlineClass}>
      <h3>Samenvatting</h3>
      <p>
        {formatShortDate(range.start)} - {formatShortDate(range.end)}
      </p>
      <p>{summaryText}</p>
      <p>
        {totalFree} dagen vrij, waarvan {highlighted} al gemarkeerd
      </p>
      <div className="summary-weekdays">
        {weekdayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      {showHolidays && <p>Let op: feestdagen tellen mee als vrije dagen.</p>}
      <button onClick={handleCopy}>{copied ? 'Gekopieerd!' : 'Kopieer samenvatting'}</button>
    </div>
  );
}
