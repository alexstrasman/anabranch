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
        style={{ flex: 1, resize: 'none' }}
        placeholder="Message…"
      />
      <button onClick={send}>Send</button>
    </div>
  )
}
