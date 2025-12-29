import { useState, useEffect } from 'react';
import { format, parseISO, startOfToday, addYears, endOfYear } from 'date-fns';
import { nl } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateBestRange, findCheapestRange, findBestRatioRanges } from './utils/calculator';
import CalendarView from './components/CalendarView';
import { useTheme } from './hooks/useTheme';
import ShareButton from './components/ShareButton';
import ThemeSelector from './components/ThemeSelector';
import SchoolHolidays from './components/SchoolHolidays';
import './App.css';

function App() {
  const { theme } = useTheme(); // toggleTheme is now handled inside ThemeSelector, but we keep theme for other uses if needed
  const [mode, setMode] = useState('max_free'); // 'max_free', 'find_range', 'best_ratio', or 'school_holidays'
  const [vacationDays, setVacationDays] = useState(20);
  const [targetLength, setTargetLength] = useState(14); // Default 2 weeks
  const [startDate, setStartDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfYear(addYears(new Date(), 1)), 'yyyy-MM-dd')); // Default end of next year
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5]); // Default Mon-Fri
  const [result, setResult] = useState(null);

  // New state for best_ratio mode
  const [minLength, setMinLength] = useState(5); // Minimum days free
  const [maxCost, setMaxCost] = useState(3); // Max vacation days per period
  const [ratioResults, setRatioResults] = useState([]);
  const [selectedRatioResult, setSelectedRatioResult] = useState(null);

  useEffect(() => {
    if (startDate && endDate && mode !== 'school_holidays') {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      let best = null;

      if (mode === 'max_free' && vacationDays >= 0) {
        best = calculateBestRange(start, parseInt(vacationDays), workDays, end);
        setResult(best);
      } else if (mode === 'find_range' && targetLength > 0) {
        best = findCheapestRange(start, parseInt(targetLength), workDays, end);
        setResult(best);
      } else if (mode === 'best_ratio' && minLength > 0 && maxCost > 0) {
        const ranges = findBestRatioRanges(start, parseInt(minLength), parseInt(maxCost), workDays, end);
        setRatioResults(ranges);
        setSelectedRatioResult(null);
        setResult(null);
      }
    }
  }, [mode, vacationDays, targetLength, startDate, endDate, workDays, minLength, maxCost]);

  const toggleWorkDay = (dayIndex) => {
    setWorkDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(d => d !== dayIndex);
      } else {
        return [...prev, dayIndex].sort();
      }
    });
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
            Verlof inzetten
          </button>
          <button
            className={`mode-btn ${mode === 'find_range' ? 'active' : ''}`}
            onClick={() => setMode('find_range')}
          >
            Dagen vrij
          </button>
          <button
            className={`mode-btn ${mode === 'best_ratio' ? 'active' : ''}`}
            onClick={() => setMode('best_ratio')}
          >
            🏆 Top 10 Beste Factor
          </button>
        </div>

        {mode === 'school_holidays' ? (
          <SchoolHolidays />
        ) : (
          <div className="input-grid">
            <div className="input-group">
              {mode === 'max_free' && (
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
              )}
              {mode === 'find_range' && (
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
              {mode === 'best_ratio' && (
                <>
                  <label className="label" htmlFor="availableDays">Hoeveel verlofdagen heb je totaal?</label>
                  <input
                    id="availableDays"
                    className="input"
                    type="number"
                    min="1"
                    max="50"
                    value={vacationDays}
                    onChange={(e) => setVacationDays(e.target.value)}
                  />
                  <p className="input-hint">Periodes die je kunt betalen worden gemarkeerd</p>
                </>
              )}
            </div>

            {mode === 'best_ratio' && (
              <>
                <div className="input-group">
                  <label className="label" htmlFor="minLength">Minimaal aantal dagen vrij:</label>
                  <input
                    id="minLength"
                    className="input"
                    type="number"
                    min="1"
                    max="30"
                    value={minLength}
                    onChange={(e) => setMinLength(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="label" htmlFor="maxCost">Max verlof per periode:</label>
                  <input
                    id="maxCost"
                    className="input"
                    type="number"
                    min="1"
                    max="20"
                    value={maxCost}
                    onChange={(e) => setMaxCost(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="input-group">
              <label className="label" htmlFor="startDate">Zoekperiode:</label>
              <div className="input-wrapper date-range">
                <div className="date-input-group">
                  <span className="date-label">Van</span>
                  <input
                    id="startDate"
                    className="input"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="date-input-group">
                  <span className="date-label">Tot</span>
                  <input
                    id="endDate"
                    className="input"
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
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
          {/* Ranking display for best_ratio mode */}
          {mode === 'best_ratio' && ratioResults.length > 0 && (
            <motion.div
              key="ratio-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="result-card"
            >
              <div className="result-header">
                <h2 className="result-title">🏆 Top 10 Beste Factor</h2>
                <p className="subtitle">
                  Periodes gesorteerd op efficiëntie (meeste vrije dagen per verlofdag)
                </p>
              </div>

              {/* Calculate cumulative costs */}
              {(() => {
                let cumulativeCost = 0;
                const ranksWithCumulative = ratioResults.map((range, index) => {
                  cumulativeCost += range.cost;
                  return { ...range, cumulativeCost, rank: index + 1 };
                });

                // Find how many periods can be afforded
                const affordablePeriods = ranksWithCumulative.filter(r => r.cumulativeCost <= parseInt(vacationDays));
                const affordableCount = affordablePeriods.length;

                // Calculate total average factor for affordable periods
                const totalFreeDays = affordablePeriods.reduce((sum, r) => sum + r.totalDays, 0);
                const totalCost = affordablePeriods.reduce((sum, r) => sum + r.cost, 0);
                const averageFactor = totalCost > 0 ? Math.round((totalFreeDays / totalCost) * 10) / 10 : 0;

                return (
                  <>
                    {affordableCount > 0 && (
                      <div className="affordable-info" style={{
                        background: 'var(--color-success)',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontWeight: '600'
                      }}>
                        ✨ Met {vacationDays} verlofdagen kun je {affordableCount} van deze periodes boeken! Gemiddelde factor: {averageFactor}x ({totalFreeDays} dagen vrij voor {totalCost} verlofdagen)
                      </div>
                    )}

                    <div className="ranking-table">
                      {ranksWithCumulative.map((range) => {
                        const isAffordable = range.cumulativeCost <= parseInt(vacationDays);
                        const medals = ['🥇', '🥈', '🥉'];
                        const medal = medals[range.rank - 1] || `${range.rank}.`;

                        return (
                          <motion.div
                            key={range.start.toString()}
                            className={`ranking-row ${isAffordable ? 'affordable' : 'not-affordable'} ${selectedRatioResult === range ? 'selected' : ''}`}
                            onClick={() => setSelectedRatioResult(selectedRatioResult === range ? null : range)}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '40px 1fr auto auto auto',
                              gap: '0.75rem',
                              alignItems: 'center',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              marginBottom: '0.5rem',
                              cursor: 'pointer',
                              background: isAffordable
                                ? 'linear-gradient(135deg, rgba(var(--color-success-rgb, 34, 197, 94), 0.15), rgba(var(--color-success-rgb, 34, 197, 94), 0.05))'
                                : 'var(--color-surface)',
                              border: selectedRatioResult === range
                                ? '2px solid var(--color-primary)'
                                : isAffordable
                                  ? '2px solid var(--color-success)'
                                  : '1px solid var(--color-border)',
                              opacity: isAffordable ? 1 : 0.6
                            }}
                          >
                            <span style={{ fontSize: '1.25rem', textAlign: 'center' }}>{medal}</span>
                            <div>
                              <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                                {format(range.start, 'd MMM', { locale: nl })} - {format(range.end, 'd MMM yyyy', { locale: nl })}
                              </div>
                              {range.holidays.length > 0 && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-warning)', marginTop: '2px' }}>
                                  🎉 {range.holidays.slice(0, 2).join(', ')}{range.holidays.length > 2 ? ` +${range.holidays.length - 2}` : ''}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--color-text)' }}>{range.totalDays}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>dagen vrij</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--color-secondary)' }}>{range.cost}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>verlof</div>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: '50px' }}>
                              <div style={{
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                color: range.ratio === Infinity ? 'var(--color-warning)' : 'var(--color-success)'
                              }}>
                                {range.ratio === Infinity ? '∞' : `${range.ratio}x`}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>factor</div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}

              {/* Show calendar for selected period */}
              {selectedRatioResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: '1.5rem' }}
                >
                  <h3 style={{ marginBottom: '1rem', color: 'var(--color-text)' }}>
                    📅 Details: {format(selectedRatioResult.start, 'd MMMM', { locale: nl })} - {format(selectedRatioResult.end, 'd MMMM yyyy', { locale: nl })}
                  </h3>

                  <div className="stat-grid" style={{ marginBottom: '1rem' }}>
                    <div className="stat-item">
                      <div className="stat-value">{selectedRatioResult.totalDays}</div>
                      <div className="stat-label">Dagen vrij</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{selectedRatioResult.cost}</div>
                      <div className="stat-label">Verlof opnemen</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value" style={{ color: 'var(--color-success)' }}>
                        {selectedRatioResult.ratio === Infinity ? '∞' : `${selectedRatioResult.ratio}x`}
                      </div>
                      <div className="stat-label">Factor</div>
                    </div>
                  </div>

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
                    <CalendarView result={selectedRatioResult} />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {mode !== 'school_holidays' && mode !== 'best_ratio' && result && (
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
