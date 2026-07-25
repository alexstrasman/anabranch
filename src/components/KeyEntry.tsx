import { useState } from 'react'
import { useStore } from '../state/store'

export function KeyEntry() {
  const setApiKey = useStore((s) => s.setApiKey)
  const [value, setValue] = useState('')
  return (
    <div style={{ maxWidth: 420, margin: '15vh auto', fontFamily: 'system-ui' }}>
      <h1>Tangent</h1>
      <p>Paste an Anthropic API key to begin.</p>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
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
        onClick={() => value.trim() && setApiKey(value.trim())}
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
