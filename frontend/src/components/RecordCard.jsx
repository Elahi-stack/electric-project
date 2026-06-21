export default function RecordCard({ record, index }) {
  const fields = [
    { label: 'Name',    value: record.name,    icon: '👤' },
    { label: 'Village', value: record.village,  icon: '🏘️' },
    { label: 'Address', value: record.address,  icon: '📍' },
    { label: 'AGL',     value: record.agl,      icon: '🔗' },
    { label: 'Phone',   value: record.phone,    icon: '📞', link: record.phone ? `tel:${record.phone.replace(/\D/g,'')}` : null },
    { label: 'Caste',   value: record.cast,     icon: '🏷️' },
    { label: 'Remarks', value: record.remarks,  icon: '📝' },
  ]

  return (
    <div
      className="result-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Card header row */}
      <div className="flex items-start justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest
                         uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full border
                         border-blue-200">
          🔌 HSC Record
        </span>
        <span className="text-xs text-slate-400 font-mono">#{index + 1}</span>
      </div>

      {/* HSC number highlight */}
      {record.hsc && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="field-label mb-1">HSC Number</p>
          <p className="text-blue-700 font-mono text-lg font-bold tracking-wider">
            {record.hsc}
          </p>
        </div>
      )}

      {/* Fields grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(({ label, value, icon, link }) =>
          value ? (
            <div key={label} className="min-w-0">
              <p className="field-label">{label}</p>
              <p className="field-value flex items-start gap-1.5">
                <span className="mt-0.5 text-base flex-shrink-0">{icon}</span>
                {link ? (
                  <a href={link} className="break-words text-blue-600 hover:text-blue-800 underline underline-offset-2">
                    {value}
                  </a>
                ) : (
                  <span className="break-words">{value}</span>
                )}
              </p>
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}
