import { motion } from 'framer-motion';

export default function SchoolHolidays() {
  const holidays = [
    {
      name: 'Herfstvakantie',
      north: '18 okt t/m 26 okt 2025',
      middle: '18 okt t/m 26 okt 2025',
      south: '11 okt t/m 19 okt 2025',
    },
    {
      name: 'Kerstvakantie',
      north: '20 dec 2025 t/m 4 jan 2026',
      middle: '20 dec 2025 t/m 4 jan 2026',
      south: '20 dec 2025 t/m 4 jan 2026',
    },
    {
      name: 'Voorjaarsvakantie',
      north: '21 feb t/m 1 mrt 2026',
      middle: '14 feb t/m 22 feb 2026',
      south: '14 feb t/m 22 feb 2026',
    },
    {
      name: 'Meivakantie',
      north: '25 apr t/m 3 mei 2026',
      middle: '25 apr t/m 3 mei 2026',
      south: '25 apr t/m 3 mei 2026',
    },
    {
      name: 'Zomervakantie',
      north: '4 jul t/m 16 aug 2026',
      middle: '18 jul t/m 30 aug 2026',
      south: '11 jul t/m 23 aug 2026',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="holidays-container"
    >
      <h2 className="result-title">Schoolvakanties 2025-2026</h2>
      <p className="subtitle" style={{ marginBottom: '2rem' }}>
        Overzicht van de adviesdata voor schoolvakanties van het ministerie van OCW.
      </p>

      <div className="holidays-table-wrapper">
        <table className="holidays-table">
          <thead>
            <tr>
              <th>Vakantie</th>
              <th>Regio Noord</th>
              <th>Regio Midden</th>
              <th>Regio Zuid</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((holiday, index) => (
              <tr key={index}>
                <td className="holiday-name">{holiday.name}</td>
                <td data-label="Regio Noord">{holiday.north}</td>
                <td data-label="Regio Midden">{holiday.middle}</td>
                <td data-label="Regio Zuid">{holiday.south}</td>
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
      </div>
    </motion.div>
  );
}
