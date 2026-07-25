import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import type { Thread } from '../domain/types'
import { useStore } from '../state/store'
import { MessageView } from '../components/MessageView'
import { Composer } from '../components/Composer'

type ThreadNodeType = Node<{ thread: Thread }>

export function ThreadNode({ data }: NodeProps<ThreadNodeType>) {
  const thread = data.thread
  const sendMessage = useStore((s) => s.sendMessage)
  return (
    <div style={{ width: 380, border: '1px solid #999', background: '#fff', borderRadius: 6 }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ maxHeight: 320, overflowY: 'auto' }} className="nodrag nowheel">
        {thread.quotedText && (
          <blockquote style={{ margin: 8, borderLeft: '3px solid #ccc', paddingLeft: 8, color: '#666' }}>
            {thread.quotedText}
          </blockquote>
        )}
        {thread.messages.map((m) => (
          <div key={m.id} style={{ position: 'relative' }}>
            <MessageView message={m} />
            <button
              onClick={() => useStore.getState().branch(thread.id, m.id)}
              style={{ position: 'absolute', right: 4, top: 4, fontSize: 10 }}
            >
              ⑃ branch
            </button>
            {/* Per-message source handle so an edge can anchor to this exact message */}
            <Handle type="source" position={Position.Right} id={m.id} style={{ top: 12 }} />
          </div>
        ))}
      </div>
      <Composer onSend={(text) => sendMessage(thread.id, text)} />
    </div>
  )
}
