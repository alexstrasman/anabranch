import { useState } from 'react'

export function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('')
  const send = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }
  return (
    <div style={{ display: 'flex', gap: 4, padding: 8 }} className="nodrag">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        style={{
          flex: 1,
          resize: 'none',
          background: '#2a2a2a',
          color: '#f0f0f0',
          border: '1px solid #4a4a4a',
          borderRadius: 3,
          padding: 4,
          font: 'inherit',
        }}
        placeholder="Message…"
      />
      <button
        onClick={send}
        style={{
          background: '#2a2a2a',
          color: '#f0f0f0',
          border: '1px solid #4a4a4a',
          borderRadius: 3,
          padding: '0 10px',
          cursor: 'pointer',
        }}
      >
        Send
      </button>
    </div>
  )
}
