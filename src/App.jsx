import { useState, useEffect } from 'react';
import { format, parseISO, startOfToday, addYears, startOfYear } from 'date-fns';
import { nl } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateBestRange, findCheapestRange } from './utils/calculator';
import CalendarView from './components/CalendarView';
import { useTheme } from './hooks/useTheme';
import ShareButton from './components/ShareButton';
import ThemeSelector from './components/ThemeSelector';
import SchoolHolidays from './components/SchoolHolidays';
import './App.css';

function App() {
  const { theme } = useTheme(); // toggleTheme is now handled inside ThemeSelector, but we keep theme for other uses if needed
  const [mode, setMode] = useState('max_free'); // 'max_free', 'find_range', or 'school_holidays'
  const [vacationDays, setVacationDays] = useState(20);
  const [targetLength, setTargetLength] = useState(14); // Default 2 weeks
  const [startDate, setStartDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5]); // Default Mon-Fri
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (startDate && mode !== 'school_holidays') {
      const start = parseISO(startDate);
      let best = null;

      if (mode === 'max_free' && vacationDays >= 0) {
        best = calculateBestRange(start, parseInt(vacationDays), workDays);
      } else if (mode === 'find_range' && targetLength > 0) {
        best = findCheapestRange(start, parseInt(targetLength), workDays);
      }

      setResult(best);
    }
  }, [mode, vacationDays, targetLength, startDate, workDays]);

  const toggleWorkDay = (dayIndex) => {
    setWorkDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(d => d !== dayIndex);
      } else {
        return [...prev, dayIndex].sort();
      }
    });
  };

  const setDateToday = () => {
    setStartDate(format(startOfToday(), 'yyyy-MM-dd'));
  };

  const setDateNextYear = () => {
    const nextYear = startOfYear(addYears(new Date(), 1));
    setStartDate(format(nextYear, 'yyyy-MM-dd'));
  };

  const weekDays = [
    { id: 1, label: 'Ma' },
    { id: 2, label: 'Di' },
    { id: 3, label: 'Wo' },
    { id: 4, label: 'Do' },
    { id: 5, label: 'Vr' },
    { id: 6, label: 'Za' },
    { id: 0, label: 'Zo' },
  ];

  return (
    <div className="container">
      <header className="header">
        <div className="header-controls">
          <ThemeSelector />
          <button
            className={`share-btn ${mode === 'school_holidays' ? 'active' : ''}`}
            onClick={() => setMode(mode === 'school_holidays' ? 'max_free' : 'school_holidays')}
            title="Schoolvakanties"
            style={mode === 'school_holidays' ? { background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' } : {}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </button>
          <ShareButton />
        </div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="title"
        >
          slimverlof.nl
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="subtitle"
        >
          Bereken hoe je met zo min mogelijk verlof of vakantiedagen zo lang mogelijk aaneengesloten vrij kunt zijn door slim gebruik te maken van feestdagen en weekenden.
        </motion.p>
      </header>

      <main className="card">
        {/* Mode Switcher */}
        <div className="mode-switcher">
          <button
            className={`mode-btn ${mode === 'max_free' ? 'active' : ''}`}
            onClick={() => setMode('max_free')}
          >
            Aantal verlof dagen inzetten
          </button>
          <button
            className={`mode-btn ${mode === 'find_range' ? 'active' : ''}`}
            onClick={() => setMode('find_range')}
          >
            Vind aantal dagen vrij
          </button>
        </div>

        {mode === 'school_holidays' ? (
          <SchoolHolidays />
        ) : (
          <div className="input-grid">
            <div className="input-group">
              {mode === 'max_free' ? (
                <>
                  <label className="label" htmlFor="vacationDays">Verlofdagen om in te zetten:</label>
                  <input
                    id="vacationDays"
                    className="input"
                    type="number"
                    min="0"
                    max="365"
                    value={vacationDays}
                    onChange={(e) => setVacationDays(e.target.value)}
                  />
                </>
              ) : (
                <>
                  <label className="label" htmlFor="targetLength">Hoe lang wil je vrij zijn?</label>
                  <input
                    id="targetLength"
                    className="input"
                    type="number"
                    min="1"
                    max="365"
                    value={targetLength}
                    onChange={(e) => setTargetLength(e.target.value)}
                  />
                </>
              )}
            </div>

            <div className="input-group">
              <label className="label" htmlFor="startDate">Zoeken vanaf:</label>
              <div className="input-wrapper">
                <input
                  id="startDate"
                  className="input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <button onClick={setDateToday} className="btn-icon" title="Vandaag">
                  Vandaag
                </button>
                <button onClick={setDateNextYear} className="btn-icon" title="Volgend jaar">
                  1 Jan {new Date().getFullYear() + 1}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="label">Werkdagen / part-time</label>
              <div className="work-days-grid">
                {weekDays.map(day => (
                  <button
                    key={day.id}
                    onClick={() => toggleWorkDay(day.id)}
                    className={`day-btn ${workDays.includes(day.id) ? 'active' : ''}`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {mode !== 'school_holidays' && result && (
            <motion.div
              key={result.start.toString() + mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="result-card"
            >
              <div className="result-header">
                <h2 className="result-title">
                  {mode === 'max_free' ? 'Jouw langste vakantie' : 'Jouw gunstigste periode'}
                </h2>
                <p className="subtitle" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                  {format(result.start, 'd MMMM yyyy', { locale: nl })} - {format(result.end, 'd MMMM yyyy', { locale: nl })}
                </p>
              </div>

              <div className="stat-grid">
                <div className="stat-item">
                  <div className="stat-value">{result.totalDays}</div>
                  <div className="stat-label">Dagen al vrij</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{result.cost}</div>
                  <div className="stat-label">Verlof opnemen</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value" style={{ color: 'var(--color-success)' }}>
                    {Math.round((result.totalDays / (result.cost || 1)) * 10) / 10}x
                  </div>
                  <div className="stat-label">Factor</div>
                </div>
              </div>

              <div className="breakdown-grid">
                {/* Dates to Book */}
                <div className="breakdown-section">
                  <h3 className="breakdown-title" style={{ color: 'var(--color-secondary)' }}>
                    <div style={{ width: 8, height: 8, background: 'currentColor', borderRadius: 2 }} />
                    Voor deze dagen moet je verlof opnemen: ({result.days.filter(d => !d.isFree).length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {result.days.filter(d => !d.isFree).map(day => (
                      <div key={day.date.toString()} className="list-item">
                        <strong>{format(day.date, 'd MMM', { locale: nl })}</strong>
                        <span>{format(day.date, 'EEEE', { locale: nl })}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Free Days (Holidays & Weekends) */}
                <div className="breakdown-section">
                  <h3 className="breakdown-title" style={{ color: 'var(--color-primary)' }}>
                    <div style={{ width: 8, height: 8, background: 'currentColor', borderRadius: 2 }} />
                    Deze dagen krijg je cadeau: ({result.days.filter(d => d.isFree).length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {result.days.filter(d => d.holidayName).map(day => (
                      <div key={day.date.toString()} className="list-item" style={{ color: 'var(--color-warning)' }}>
                        <strong>{format(day.date, 'd MMM', { locale: nl })}</strong>
                        <span>🎉 {day.holidayName}</span>
                      </div>
                    ))}
                    {result.days.filter(d => d.isFree && !d.holidayName).length > 0 && (
                      <div className="list-item" style={{ fontStyle: 'italic', marginTop: '0.5rem' }}>
                        + {result.days.filter(d => d.isFree && !d.holidayName).length} weekend/vrije dagen
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Visual Calendar */}
              <div className="calendar-section">
                <div className="legend">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ backgroundColor: 'var(--color-secondary)' }}></div>
                    <span>Verlof opnemen</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ backgroundColor: 'var(--color-warning)' }}></div>
                    <span>Feestdag</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                    <span>Vrij / Weekend</span>
                  </div>
                </div>
                <CalendarView result={result} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
