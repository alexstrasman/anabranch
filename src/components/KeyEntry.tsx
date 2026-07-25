import { useState } from 'react'
import { useStore } from '../state/store'

export function KeyEntry() {
  const setApiKey = useStore((s) => s.setApiKey)
  const [value, setValue] = useState('')
  const submit = () => {
    const trimmed = value.trim()
    if (trimmed) setApiKey(trimmed)
  }
  return (
    <div style={{ maxWidth: 420, margin: '15vh auto', fontFamily: 'system-ui' }}>
      <h1>Tangent</h1>
      <p id="key-entry-hint">Paste an Anthropic API key to begin.</p>
      <input
        id="api-key"
        type="password"
        aria-label="Anthropic API key"
        aria-describedby="key-entry-hint"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        // Every visitor lands here; a password field that ignores Enter is a
        // dead end for anyone who just pasted a key and expects to continue.
        onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
        placeholder="sk-ant-…"
        style={{
          width: '100%',
          padding: 8,
          background: '#2a2a2a',
          color: '#f0f0f0',
          border: '1px solid #4a4a4a',
          borderRadius: 3,
          font: 'inherit',
          boxSizing: 'border-box',
        }}
      />
      <button
        onClick={submit}
        style={{
          marginTop: 8,
          width: '100%',
          padding: 8,
          background: '#2a2a2a',
          color: '#f0f0f0',
          border: '1px solid #4a4a4a',
          borderRadius: 3,
          font: 'inherit',
          cursor: 'pointer',
        }}
      >
        Start
      </button>
      <p style={{ color: '#a0a0a0', fontSize: 12, marginTop: 12 }}>
        Your key never leaves your browser except to go to Anthropic.
      </p>
    </div>
  )
}
