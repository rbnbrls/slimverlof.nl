import { useState, useMemo, useEffect, useRef } from 'react';
import { format, parseISO, startOfToday, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateBestRange, findCheapestRange, findBestRatioRanges } from './utils/calculator';
import { getYearEndCountdown } from './utils/yearEndCountdown';
import CalendarView from './components/CalendarView';
import ShareButton from './components/ShareButton';
import ThemeSelector from './components/ThemeSelector';
import SchoolHolidays from './components/SchoolHolidays';
import './App.css';

function App() {
  const yearEndCountdown = getYearEndCountdown(startOfToday());
  const [mode, setMode] = useState('max_free'); // 'max_free', 'find_range', 'best_ratio', or 'school_holidays'
  const [vacationDays, setVacationDays] = useState(20);
  const [targetLength, setTargetLength] = useState(14); // Default 2 weeks
  const [startDate, setStartDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 365), 'yyyy-MM-dd')); // Default 365 days from today
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5]); // Default Mon-Fri
  const [selectedRatioResult, setSelectedRatioResult] = useState(null);

  // New state for best_ratio mode
  const [minLength, setMinLength] = useState(5); // Minimum days free
  const [maxCost, setMaxCost] = useState(3); // Max vacation days per period
  const [planMultipleBlocks, setPlanMultipleBlocks] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardComplete, setWizardComplete] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    mainRef.current?.focus();
  }, [mode, wizardStep]);

  // Derive result for max_free and find_range modes
  const result = useMemo(() => {
    if (!startDate || !endDate || mode === 'school_holidays' || mode === 'best_ratio') return null;
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (mode === 'max_free' && vacationDays >= 0) {
      return calculateBestRange(start, parseInt(vacationDays), workDays, end);
    }
    if (mode === 'find_range' && targetLength > 0) {
      return findCheapestRange(start, parseInt(targetLength), workDays, end);
    }
    return null;
  }, [mode, vacationDays, targetLength, startDate, endDate, workDays]);

  // Derive ratioResults for best_ratio mode
  const ratioResults = useMemo(() => {
    const isRatioPlan = mode === 'best_ratio' || (mode === 'max_free' && planMultipleBlocks);
    if (!startDate || !endDate || !isRatioPlan) return [];
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const searchMinLength = mode === 'max_free' ? 5 : parseInt(minLength);
    const searchMaxCost = mode === 'max_free' ? Math.min(3, parseInt(vacationDays) || 3) : parseInt(maxCost);
    if (searchMinLength > 0 && searchMaxCost > 0) {
      return findBestRatioRanges(start, searchMinLength, searchMaxCost, workDays, end);
    }
    return [];
  }, [mode, minLength, maxCost, planMultipleBlocks, vacationDays, startDate, endDate, workDays]);

  const toggleWorkDay = (dayIndex) => {
    setWorkDays((prev) => {
      if (prev.includes(dayIndex)) {
        return prev.filter((d) => d !== dayIndex);
      } else {
        return [...prev, dayIndex].sort();
      }
    });
  };

  const selectMode = (nextMode) => {
    setMode(nextMode);
    setWizardStep(2);
    setWizardComplete(false);
    setSelectedRatioResult(null);
    setPlanMultipleBlocks(false);
  };

  const goBack = () => {
    setWizardComplete(false);
    setWizardStep((step) => Math.max(1, step - 1));
  };

  const goNext = () => {
    setWizardStep((step) => Math.min(4, step + 1));
  };

  const calculate = () => {
    setWizardComplete(true);
  };

  const restartWizard = () => {
    setMode('max_free');
    setVacationDays(20);
    setTargetLength(14);
    setStartDate(format(startOfToday(), 'yyyy-MM-dd'));
    setEndDate(format(addDays(new Date(), 365), 'yyyy-MM-dd'));
    setWorkDays([1, 2, 3, 4, 5]);
    setMinLength(5);
    setMaxCost(3);
    setPlanMultipleBlocks(false);
    setSelectedRatioResult(null);
    setWizardComplete(false);
    setWizardStep(1);
  };

  const weekDays = [
    { id: 1, label: 'Ma', fullLabel: 'maandag' },
    { id: 2, label: 'Di', fullLabel: 'dinsdag' },
    { id: 3, label: 'Wo', fullLabel: 'woensdag' },
    { id: 4, label: 'Do', fullLabel: 'donderdag' },
    { id: 5, label: 'Vr', fullLabel: 'vrijdag' },
    { id: 6, label: 'Za', fullLabel: 'zaterdag' },
    { id: 0, label: 'Zo', fullLabel: 'zondag' },
  ];

  return (
    <div className="container">
      <header className="header">
        <div className="header-controls">
          <ThemeSelector />
          <button
            type="button"
            className={`share-btn ${mode === 'school_holidays' ? 'active' : ''}`}
            onClick={() => setMode(mode === 'school_holidays' ? 'max_free' : 'school_holidays')}
            title="Schoolvakanties"
            data-tooltip="Bekijk schoolvakanties per schooljaar en regio"
            aria-label="Schoolvakanties"
            aria-pressed={mode === 'school_holidays'}
            style={
              mode === 'school_holidays'
                ? {
                    background: 'var(--color-primary)',
                    color: 'white',
                    borderColor: 'var(--color-primary)',
                  }
                : {}
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
          id="page-title"
        >
          <button
            type="button"
            className="brand-button"
            onClick={restartWizard}
            aria-label="Opnieuw beginnen met slimverlof.nl"
            title="Opnieuw beginnen"
          >
            slimverlof.nl
          </button>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="subtitle"
        >
          Plan je verlof met feestdagen, weekenden en je eigen werkdagen. Kies je doel en beantwoord
          stap voor stap de vragen van de planner.
          <span className="school-holidays-hint">
            De schoolvakanties vind je via de knop met het school-icoon bovenaan. Daar kun je per
            schooljaar en regio de adviesdata bekijken.
          </span>
          {yearEndCountdown && (
            <span className="year-end-countdown">
              Nog {yearEndCountdown.days} dagen tot 1 januari {yearEndCountdown.year}, dan krijg je
              weer nieuwe vakantiedagen.
            </span>
          )}
        </motion.p>
      </header>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {mode === 'school_holidays'
          ? 'Schoolvakantieoverzicht geopend.'
          : mode === 'best_ratio'
            ? '6 suggesties geopend.'
            : mode === 'max_free' && planMultipleBlocks
              ? 'Meerdere vakantieblokken geopend.'
            : mode === 'find_range'
              ? 'Dagen vrij geopend.'
              : 'Verlof inzetten geopend.'}
        {result &&
          ` Resultaat: ${format(result.start, 'd MMMM yyyy', { locale: nl })} tot ${format(result.end, 'd MMMM yyyy', { locale: nl })}, ${result.totalDays} dagen vrij en ${result.cost} verlofdagen.`}
      </div>

      <main className="card" ref={mainRef} tabIndex="-1" aria-labelledby="page-title">
        {mode === 'school_holidays' ? (
          <SchoolHolidays />
        ) : (
          <div className="wizard" aria-label="Verlofplanner wizard">
            <div className="wizard-toolbar">
              <div className="wizard-progress" aria-label={`Stap ${wizardStep} van 4`}>
                <span>Stap {wizardStep} van 4</span>
                <div className="wizard-progress-bar" aria-hidden="true">
                  <span style={{ width: `${(wizardStep / 4) * 100}%` }} />
                </div>
              </div>
              <button type="button" className="wizard-restart" onClick={restartWizard}>
                Opnieuw beginnen
              </button>
            </div>

            {wizardStep === 1 && (
              <section className="wizard-step" aria-labelledby="wizard-start-heading">
                <h2 id="wizard-start-heading">Wat wil je bereiken?</h2>
                <p className="wizard-intro">Kies één doel. Daarna stellen we alleen de vragen die daarvoor nodig zijn.</p>
                <div className="scenario-grid" role="group" aria-label="Kies je planningsdoel">
                  <button type="button" className="scenario-card" onClick={() => selectMode('max_free')}>
                    <strong>Maximaliseer je vrije tijd</strong>
                    <span>Gebruik het aantal vakantiedagen dat je hebt en vind de langste aaneengesloten periode vrij.</span>
                  </button>
                  <button type="button" className="scenario-card" onClick={() => selectMode('find_range')}>
                    <strong>Kies je gewenste vrije periode</strong>
                    <span>Kies het aantal aaneengesloten dagen dat je vrij wilt zijn, met zo min mogelijk verlofdagen.</span>
                  </button>
                  <button type="button" className="scenario-card" onClick={() => selectMode('best_ratio')}>
                    <strong>Bekijk 6 suggesties</strong>
                    <span>Bekijk 6 slimme momenten in het komende jaar, gesorteerd op vrije dagen per verlofdag.</span>
                  </button>
                </div>
              </section>
            )}

            {wizardStep === 2 && (
              <section className="wizard-step" aria-labelledby="wizard-goal-heading">
                <h2 id="wizard-goal-heading">
                  {mode === 'max_free'
                    ? 'Hoeveel vakantiedagen wil je inzetten?'
                    : mode === 'find_range'
                      ? 'Hoeveel dagen wil je aaneengesloten vrij zijn?'
                      : 'Hoeveel vakantiedagen heb je beschikbaar?'}
                </h2>
                <p className="wizard-intro">
                  {mode === 'max_free'
                    ? 'We zoeken de langste periode die binnen dit aantal dagen past.'
                    : mode === 'find_range'
                      ? 'We zoeken de periode die dit doel met de minste verlofdagen haalt.'
                      : 'We markeren welke van de 6 suggesties je met jouw saldo kunt boeken.'}
                </p>
                <label
                  className="wizard-field"
                  htmlFor={
                    mode === 'find_range'
                      ? 'targetLength'
                      : mode === 'best_ratio'
                        ? 'availableDays'
                        : 'vacationDays'
                  }
                >
                  <span>{mode === 'find_range' ? 'Aantal dagen vrij' : 'Beschikbare vakantiedagen'}</span>
                  <input
                    id={
                      mode === 'find_range'
                        ? 'targetLength'
                        : mode === 'best_ratio'
                          ? 'availableDays'
                          : 'vacationDays'
                    }
                    className="input wizard-number-input"
                    type="number"
                    min="1"
                    max={mode === 'find_range' ? '365' : '50'}
                    value={mode === 'find_range' ? targetLength : vacationDays}
                    onChange={(event) =>
                      mode === 'find_range'
                        ? setTargetLength(event.target.value)
                        : setVacationDays(event.target.value)
                    }
                  />
                </label>
                {mode === 'max_free' && (
                  <label className="wizard-option">
                    <input
                      id="multipleBlocks"
                      type="checkbox"
                      checked={planMultipleBlocks}
                      onChange={(event) => setPlanMultipleBlocks(event.target.checked)}
                    />
                    <span>
                      <strong>Plan meerdere vakantieblokken</strong>
                      <small>We zoeken meerdere losse periodes van minimaal 5 dagen, met maximaal 3 verlofdagen per blok.</small>
                    </span>
                  </label>
                )}
                <div className="wizard-actions">
                  <button type="button" className="wizard-back" onClick={() => setWizardStep(1)}>Terug</button>
                  <button type="button" className="wizard-next" onClick={goNext}>Volgende</button>
                </div>
              </section>
            )}

            {wizardStep === 3 && (
              <section className="wizard-step" aria-labelledby="wizard-period-heading">
                <h2 id="wizard-period-heading">In welke periode wil je zoeken?</h2>
                <p className="wizard-intro">De standaardperiode loopt van vandaag tot één jaar vooruit.</p>
                <div className="wizard-date-grid">
                  <label className="wizard-field" htmlFor="startDate">
                    <span>Vanaf</span>
                    <input id="startDate" className="input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                  </label>
                  <label className="wizard-field" htmlFor="endDate">
                    <span>Tot en met</span>
                    <input id="endDate" className="input" type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} />
                  </label>
                </div>
                <div className="wizard-actions">
                  <button type="button" className="wizard-back" onClick={goBack}>Terug</button>
                  <button type="button" className="wizard-next" onClick={goNext}>Volgende</button>
                </div>
              </section>
            )}

            {wizardStep === 4 && (
              <section className="wizard-step" aria-labelledby="wizard-workdays-heading">
                <h2 id="wizard-workdays-heading">Op welke dagen werk je?</h2>
                <p className="wizard-intro">Zo houden we rekening met je parttime rooster. Pas alleen aan wat anders is dan maandag tot en met vrijdag.</p>
                <div className="work-days-grid wizard-days-grid">
                  {weekDays.map((day) => (
                    <button type="button" key={day.id} onClick={() => toggleWorkDay(day.id)} className={`day-btn ${workDays.includes(day.id) ? 'active' : ''}`} aria-label={`Werkdag ${day.fullLabel}`} aria-pressed={workDays.includes(day.id)}>{day.label}</button>
                  ))}
                </div>
                <div className="wizard-actions">
                  <button type="button" className="wizard-back" onClick={goBack}>Terug</button>
                  <button type="button" className="wizard-next" onClick={calculate}>Bereken mijn verlof</button>
                </div>
              </section>
            )}

            {wizardComplete && (
              <button type="button" className="wizard-edit" onClick={() => setWizardStep(4)}>Instellingen aanpassen</button>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Ranking display for best_ratio mode */}
          {wizardComplete && (mode === 'best_ratio' || (mode === 'max_free' && planMultipleBlocks)) && ratioResults.length > 0 && (
            <motion.div
              key="ratio-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="result-card"
              role="region"
              aria-labelledby="ratio-result-heading"
            >
              <div className="result-header">
                <h2 id="ratio-result-heading" className="result-title">
                  {mode === 'max_free' ? 'Jouw vakantieblokken' : '6 suggesties'}
                </h2>
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
                const affordablePeriods = ranksWithCumulative.filter(
                  (r) => r.cumulativeCost <= parseInt(vacationDays)
                );
                const affordableCount = affordablePeriods.length;

                // Calculate total days received as a gift for affordable periods
                const totalFreeDays = affordablePeriods.reduce((sum, r) => sum + r.totalDays, 0);
                const totalCost = affordablePeriods.reduce((sum, r) => sum + r.cost, 0);
                const totalGiftDays = totalFreeDays - totalCost;

                return (
                  <>
                    {affordableCount > 0 && (
                      <div
                        className="affordable-info"
                        style={{
                          background: 'var(--color-success)',
                          color: 'var(--color-accent-ink)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          marginBottom: '1rem',
                          fontWeight: '600',
                        }}
                      >
                        Met {vacationDays} verlofdagen kun je {affordableCount} van deze periodes
                        boeken. Samen krijg je {totalGiftDays} dagen cadeau ({totalFreeDays} dagen vrij
                        voor {totalCost} verlofdagen).
                      </div>
                    )}

                    <div className="ranking-table">
                      {ranksWithCumulative.map((range) => {
                        const isAffordable = range.cumulativeCost <= parseInt(vacationDays);
                        const medal = `${range.rank}.`;

                        return (
                          <motion.div
                            key={range.start.toString()}
                            className={`ranking-row ${isAffordable ? 'affordable' : 'not-affordable'} ${selectedRatioResult === range ? 'selected' : ''}`}
                            onClick={() =>
                              setSelectedRatioResult(selectedRatioResult === range ? null : range)
                            }
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <span style={{ fontSize: '1.25rem', textAlign: 'center' }}>
                              {medal}
                            </span>
                            <div>
                              <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                                {format(range.start, 'd MMM', { locale: nl })} -{' '}
                                {format(range.end, 'd MMM yyyy', { locale: nl })}
                              </div>
                              {range.holidays.length > 0 && (
                                <div
                                  style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--color-warning)',
                                    marginTop: '2px',
                                  }}
                                >
                                  Feestdag: {range.holidays.slice(0, 2).join(', ')}
                                  {range.holidays.length > 2
                                    ? ` +${range.holidays.length - 2}`
                                    : ''}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div
                                style={{
                                  fontWeight: '700',
                                  fontSize: '1.1rem',
                                  color: 'var(--color-text)',
                                }}
                              >
                                {range.totalDays}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                dagen vrij
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div
                                style={{
                                  fontWeight: '700',
                                  fontSize: '1.1rem',
                                  color: 'var(--color-secondary)',
                                }}
                              >
                                {range.cost}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                verlof
                              </div>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: '50px' }}>
                              <div
                                style={{
                                  fontWeight: '700',
                                  fontSize: '1.1rem',
                                  color:
                                    range.ratio === Infinity
                                      ? 'var(--color-warning)'
                                      : 'var(--color-success)',
                                }}
                              >
                                {range.totalDays - range.cost}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                dagen cadeau
                              </div>
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
                    Details: {format(selectedRatioResult.start, 'd MMMM', { locale: nl })} -{' '}
                    {format(selectedRatioResult.end, 'd MMMM yyyy', { locale: nl })}
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
                        {selectedRatioResult.totalDays - selectedRatioResult.cost}
                      </div>
                      <div className="stat-label">Dagen cadeau</div>
                    </div>
                  </div>

                  <div className="calendar-section">
                    <div className="legend">
                      <div className="legend-item">
                        <div
                          className="legend-dot"
                          style={{ backgroundColor: 'var(--color-secondary)' }}
                        ></div>
                        <span>Verlof opnemen</span>
                      </div>
                      <div className="legend-item">
                        <div
                          className="legend-dot"
                          style={{ backgroundColor: 'var(--color-warning)' }}
                        ></div>
                        <span>Feestdag</span>
                      </div>
                      <div className="legend-item">
                        <div
                          className="legend-dot"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        ></div>
                        <span>Vrij / Weekend</span>
                      </div>
                    </div>
                    <CalendarView result={selectedRatioResult} />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {wizardComplete && mode !== 'school_holidays' && mode !== 'best_ratio' && !(mode === 'max_free' && planMultipleBlocks) && result && (
            <motion.div
              key={result.start.toString() + mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="result-card"
              role="region"
              aria-labelledby="calculation-result-heading"
            >
              <div className="result-summary">
                <h2 id="calculation-result-heading" className="result-title">
                  {mode === 'find_range'
                    ? `Je wil ${targetLength} dagen vrij`
                    : `Je bent ${result.totalDays} dagen vrij`}
                </h2>
                <p>
                  In de periode{' '}
                  <strong>
                    {format(result.start, 'd MMMM yyyy', { locale: nl })} -{' '}
                    {format(result.end, 'd MMMM yyyy', { locale: nl })}
                  </strong>
                </p>
                <p>
                  Met <strong>{result.cost} verlofdagen op te nemen</strong>
                </p>
                <p>
                  Krijg je <strong>{result.days.filter((day) => day.isFree).length} dagen cadeau</strong>
                </p>
                <p>
                  En ben je <strong>{result.totalDays} dagen vrij.</strong>
                </p>
              </div>

              <div className="breakdown-grid">
                {/* Dates to Book */}
                <div className="breakdown-section">
                  <h3 className="breakdown-title" style={{ color: 'var(--color-secondary)' }}>
                    <div
                      style={{ width: 8, height: 8, background: 'currentColor', borderRadius: 2 }}
                    />
                    Voor deze dagen moet je verlof opnemen: (
                    {result.days.filter((d) => !d.isFree).length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {result.days
                      .filter((d) => !d.isFree)
                      .map((day) => (
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
                    <div
                      style={{ width: 8, height: 8, background: 'currentColor', borderRadius: 2 }}
                    />
                    Deze dagen krijg je cadeau: ({result.days.filter((d) => d.isFree).length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {result.days
                      .filter((d) => d.holidayName)
                      .map((day) => (
                        <div
                          key={day.date.toString()}
                          className="list-item"
                          style={{ color: 'var(--color-warning)' }}
                        >
                          <strong>{format(day.date, 'd MMM', { locale: nl })}</strong>
                          <span>Feestdag: {day.holidayName}</span>
                        </div>
                      ))}
                    {result.days.filter((d) => d.isFree && !d.holidayName).length > 0 && (
                      <div
                        className="list-item"
                        style={{ fontStyle: 'italic', marginTop: '0.5rem' }}
                      >
                        + {result.days.filter((d) => d.isFree && !d.holidayName).length}{' '}
                        weekend/vrije dagen
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Visual Calendar */}
              <div className="calendar-section">
                <div className="legend">
                  <div className="legend-item">
                    <div
                      className="legend-dot"
                      style={{ backgroundColor: 'var(--color-secondary)' }}
                    ></div>
                    <span>Verlof opnemen</span>
                  </div>
                  <div className="legend-item">
                    <div
                      className="legend-dot"
                      style={{ backgroundColor: 'var(--color-warning)' }}
                    ></div>
                    <span>Feestdag</span>
                  </div>
                  <div className="legend-item">
                    <div
                      className="legend-dot"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    ></div>
                    <span>Vrij / Weekend</span>
                  </div>
                </div>
                <CalendarView result={result} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <section className="seo-content" aria-labelledby="about-heading">
        <h2 id="about-heading">Plan slim verlof met feestdagen en weekenden</h2>
        <p>
          Slimverlof.nl helpt je om meer vrije dagen uit je vakantiedagen te halen. Geef je
          verlofsaldo, zoekperiode en werkdagen op en ontdek welke periode de beste combinatie geeft
          van vakantie, weekenden en Nederlandse feestdagen.
        </p>
        <div className="seo-grid">
          <div>
            <h3>Voor parttimers en fulltimers</h3>
            <p>Stel je eigen werkdagen in, zodat de berekening aansluit op jouw rooster.</p>
          </div>
          <div>
            <h3>Drie manieren om te plannen</h3>
            <p>Zoek de langste vakantie, een gewenste periode of de 6 slimste momenten.</p>
          </div>
          <div>
            <h3>Direct inzicht in je verlof</h3>
            <p>
              Bekijk per dag wat verlof kost, welke feestdagen je cadeau krijgt en hoe lang je vrij
              bent.
            </p>
          </div>
        </div>
        <h2>Veelgestelde vragen over verlof plannen</h2>
        <details>
          <summary>Hoe plan ik de meeste vrije dagen met mijn vakantiedagen?</summary>
          <p>
            Vul je beschikbare verlofdagen en zoekperiode in. De planner zoekt de langste
            aaneengesloten periode met weekenden en Nederlandse feestdagen.
          </p>
        </details>
        <details>
          <summary>Kan ik de planner gebruiken als ik parttime werk?</summary>
          <p>
            Ja. Selecteer alleen de dagen waarop je normaal werkt. Zo zie je welke werkdagen je moet
            opnemen en welke dagen vrij zijn.
          </p>
        </details>
        <details>
          <summary>Welke feestdagen worden meegenomen?</summary>
          <p>
            De planner neemt Nederlandse feestdagen mee die binnen je gekozen periode vallen.
            Controleer altijd je cao en de afspraken met je werkgever.
          </p>
        </details>
      </section>
    </div>
  );
}

export default App;
