import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatSchoolHolidayRange, getSchoolYearsForDate } from '../utils/schoolHolidays';

const REGIONS = [
  { id: 'north', label: 'Regio Noord' },
  { id: 'middle', label: 'Regio Midden' },
  { id: 'south', label: 'Regio Zuid' },
];

export default function SchoolHolidays({ today = new Date() }) {
  const { current, available } = getSchoolYearsForDate(today);
  const [selectedYearId, setSelectedYearId] = useState(current.id);
  const selectedYear = available.find(({ id }) => id === selectedYearId) || current;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="holidays-container"
    >
      <div className="holiday-heading">
        <div>
          <h2 className="result-title">Schoolvakanties {selectedYear.id}</h2>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            Overzicht van de adviesdata voor schoolvakanties van het ministerie van OCW.
          </p>
        </div>
        {available.length > 1 && (
          <label className="holiday-year-selector" htmlFor="school-holiday-year">
            Schooljaar
            <select
              id="school-holiday-year"
              aria-label="Schooljaar"
              value={selectedYear.id}
              onChange={(event) => setSelectedYearId(event.target.value)}
            >
              {available.map(({ id }) => (
                <option key={id} value={id}>
                  {id}
                  {id === current.id ? ' (huidig)' : ' (volgend)'}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="holidays-table-wrapper">
        <table className="holidays-table">
          <caption className="sr-only">
            Schoolvakanties {selectedYear.id} per regio
          </caption>
          <thead>
            <tr>
              <th>Vakantie</th>
              {REGIONS.map((region) => (
                <th key={region.id}>{region.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selectedYear.holidays.map((holiday) => (
              <tr key={holiday.name}>
                <td className="holiday-name">{holiday.name}</td>
                {REGIONS.map((region) => (
                  <td key={region.id} data-label={region.label}>
                    {formatSchoolHolidayRange(holiday.regions[region.id])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="holiday-note">
        <p>
          <strong>Let op:</strong> Scholen mogen afwijken van de adviesdata voor de voorjaars- en
          herfstvakantie. De meivakantie kan door scholen met een week worden uitgebreid. Controleer
          altijd de schoolgids.
        </p>
        {selectedYear.extendedMayHolidayAdvice && (
          <p>
            Voor een uitgebreide meivakantie adviseert OCW:{' '}
            {formatSchoolHolidayRange(selectedYear.extendedMayHolidayAdvice)}.
          </p>
        )}
        <p>
          Bron:{' '}
          <a href={selectedYear.sourceUrl} target="_blank" rel="noreferrer">
            {selectedYear.sourceLabel}, schoolvakanties {selectedYear.id}
          </a>{' '}
          (adviesdata).
        </p>
      </div>
    </motion.div>
  );
}
