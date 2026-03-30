import { useState, useEffect } from 'react'
import { Briefcase, Lock } from 'lucide-react'

const STORAGE_KEY = 'tera-pm-auth'
const PASSWORD = 'tera2026!'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved === 'true') setAuthenticated(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true')
      setAuthenticated(true)
    } else {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  if (authenticated) return <>{children}</>

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Briefcase size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Tera PM</h1>
          <p className="text-sm text-slate-400 mt-1">Project Management</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={14} className="text-slate-400" />
            <span className="text-sm text-slate-300">Access Password</span>
          </div>

          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            placeholder="Enter password"
            autoFocus
            className={`w-full px-3 py-2.5 text-sm bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-slate-600'
            }`}
          />

          {error && (
            <p className="text-xs text-red-400 mt-2">Incorrect password</p>
          )}

          <button
            type="submit"
            className="w-full mt-4 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-4">
          Internal use only
        </p>
      </div>
    </div>
  )
}
