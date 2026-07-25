import type { Message } from '../domain/types'

export function MessageView({ message }: { message: Message }) {
  return (
    <div data-role={message.role} style={{ padding: '6px 8px', whiteSpace: 'pre-wrap' }}>
      <strong>{message.role === 'user' ? 'You' : 'Claude'}:</strong> {message.content}
    </div>
  )
}
