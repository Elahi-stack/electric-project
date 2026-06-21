import { useState, useCallback, useEffect, useRef } from 'react'
import axios from 'axios'
import SearchBar from './components/SearchBar'
import RecordCard from './components/RecordCard'

const API_BASE = '/api'

function speakVillages(records) {
  if (!records.length) return
  // Use pronounce field if available, fallback to village
  const villages = [...new Set(records.map((r) => r.pronounce || r.village).filter(Boolean))]
  if (!villages.length) return
  
  const text = villages.join(', ')
  
  // Proxy through our backend to bypass Google's browser restrictions (CORS/referers)
  const audioUrl = `${API_BASE}/tts?text=${encodeURIComponent(text)}`
  const audio = new Audio(audioUrl)
  audio.play().catch(e => console.error("Audio play failed:", e))
}

export default function App() {
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastQuery, setLastQuery] = useState({ query: '', type: 'hsc' })
  const [stats, setStats] = useState(null)
  const resultsRef = useRef(null)

  useEffect(() => {
    axios.get(`${API_BASE}/stats`).then((res) => setStats(res.data)).catch(() => {})
  }, [])

  const handleSearch = useCallback(async (query, searchType) => {
    setIsLoading(true)
    setError('')
    setLastQuery({ query, type: searchType })
    try {
      const { data } = await axios.get(`${API_BASE}/search`, { params: { q: query, search_type: searchType } })
      setResults(data)
      setTimeout(() => speakVillages(data), 500)
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    } catch (err) {
      if (err.response?.status === 422) {
        setError('Please enter at least 1 digit to search.')
      } else if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Make sure the backend is running on port 8000.')
      } else {
        setError(err.response?.data?.detail || 'An error occurred. Please try again.')
      }
      setResults(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">

        {/* ── Header ── */}
        <header className="text-center mb-10 animate-fade-in">
          <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center mb-4 shadow-sm overflow-hidden bg-white border border-slate-200">
            <img src="/apspdcl-logo.jpg" alt="APSPDCL Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-1 tracking-tight">
            VEMILETI KOTA HSC Records
          </h1>
          <h2 className="text-lg md:text-xl font-bold text-blue-700 mb-3">
            B.KOTHAKOTA Section , MADANAPALLE Division
          </h2>
          <p className="text-slate-500 text-sm md:text-base">
            House Service Connection — search by the last digits of the HSC number
          </p>
        </header>

        {/* ── Search Box ── */}
        <section className="glass-card p-5 md:p-6 mb-8 animate-fade-in">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </section>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200
                          text-red-600 text-sm flex items-start gap-2 animate-fade-in">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Results ── */}
        {results !== null && (
          <section ref={resultsRef} className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-600 font-semibold text-sm">
                {results.length > 0 ? (
                  <>
                    <span className="text-slate-800 font-bold">{results.length}</span>
                    {' '}result{results.length !== 1 ? 's' : ''} for{' '}
                    <span className="text-blue-600 font-mono">"{lastQuery.query}"</span>
                  </>
                ) : (
                  <>No records found for <span className="text-blue-600 font-mono">"{lastQuery.query}"</span></>
                )}
              </h2>
              {results.length > 0 && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <span>🔊</span> Reading village aloud…
                </span>
              )}
            </div>

            {results.length === 0 && (
              <div className="glass-card p-12 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-slate-500 font-medium">No matching records found.</p>
                <p className="text-slate-400 text-sm mt-1">
                  Try different digits or check if the data has been imported.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {results.map((record, i) => (
                <RecordCard key={record.id} record={record} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ── */}
        {results === null && !isLoading && (
          <div className="text-center py-16 text-slate-400 animate-fade-in">
            <div className="text-6xl mb-4">🏘️</div>
            <p className="font-medium">Enter HSC digits above to search records</p>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="mt-16 text-center text-slate-700 font-bold tracking-wide text-lg md:text-xl">
          K MUNWAR BASHA, JLM
        </footer>
      </div>
    </div>
  )
}
