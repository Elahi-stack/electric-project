import { useState, useRef, useCallback } from 'react'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default function SearchBar({ onSearch, isLoading }) {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('hsc')
  const [isListening, setIsListening] = useState(false)
  const [micError, setMicError] = useState('')
  const recognitionRef = useRef(null)

  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault()
      const trimmed = query.trim()
      if (trimmed) onSearch(trimmed, searchType)
    },
    [query, searchType, onSearch]
  )

  const startListening = () => {
    setMicError('')
    if (!SpeechRecognition) {
      setMicError('Voice input not supported in this browser.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      const digits = transcript.replace(/\D/g, '')
      setQuery(digits)
      if (digits) onSearch(digits, searchType)
    }
    recognition.onerror = (event) => {
      setMicError(`Mic error: ${event.error}`)
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" id="search-form">
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search type dropdown */}
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="w-full sm:w-auto bg-white border border-slate-300 rounded-xl px-4 py-3.5
                     text-slate-700 font-medium focus:outline-none focus:ring-2
                     focus:ring-blue-500/40 focus:border-blue-400 shadow-sm cursor-pointer"
        >
          <option value="hsc">HSC Number</option>
          <option value="agl">AGL Number</option>
        </select>

        {/* Search input */}
        <div className="relative w-full flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            id="hsc-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Enter last digits of ${searchType.toUpperCase()}`}
            className="search-input pl-12"
            inputMode="numeric"
            maxLength={15}
            autoFocus
          />
        </div>

        {/* Action buttons wrapper */}
        <div className="flex gap-3 w-full sm:w-auto">
          {/* Search button */}
          <button
          id="search-btn"
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40
                     disabled:cursor-not-allowed text-white font-semibold transition-all duration-200
                     shadow-md hover:shadow-blue-500/30 active:scale-95
                     whitespace-nowrap flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching…
            </>
          ) : 'Search'}
        </button>

        {/* Mic button */}
        <button
          id="mic-btn"
          type="button"
          onClick={isListening ? stopListening : startListening}
          title={isListening ? 'Stop listening' : 'Search by voice'}
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                      transition-all duration-200 active:scale-95 border
                      ${isListening
                        ? 'bg-red-500 text-white border-red-500 animate-pulse-mic shadow-md shadow-red-300'
                        : 'bg-white text-slate-500 hover:text-blue-600 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                      }`}
        >
          {isListening ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 18.93V21h-2v2h6v-2h-2v-1.07A7.001 7.001 0 0 0 19 13h-2a5 5 0 0 1-10 0H5a7.001 7.001 0 0 0 6 6.93z" />
            </svg>
          )}
        </button>
        </div>
      </div>

      {isListening && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
          Listening… speak the HSC digits
        </p>
      )}
      {micError && (
        <p className="mt-2 text-sm text-amber-600">{micError}</p>
      )}
    </form>
  )
}
