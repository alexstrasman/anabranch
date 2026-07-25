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
    <div
      style={{
        width: 380,
        border: '1px solid #4a4a4a',
        background: '#1e1e1e',
        color: '#f0f0f0',
        borderRadius: 6,
      }}
    >
      <Handle type="target" position={Position.Left} />
      {/* Drag surface. Every other child carries `nodrag`, so without this strip
          the node has nothing to grab. Deliberately empty: titles and collapse
          controls belong to a later theme. */}
      <div
        style={{
          height: 22,
          background: '#2a2a2a',
          borderBottom: '1px solid #4a4a4a',
          cursor: 'grab',
        }}
      />
      <div style={{ maxHeight: 320, overflowY: 'auto' }} className="nodrag nowheel">
        {thread.quotedText && (
          <blockquote style={{ margin: 8, borderLeft: '3px solid #4a4a4a', paddingLeft: 8, color: '#a0a0a0' }}>
            {thread.quotedText}
          </blockquote>
        )}
        {thread.messages.map((m) => (
          <div key={m.id} style={{ position: 'relative' }}>
            <MessageView message={m} />
            <button
              onClick={() => useStore.getState().branch(thread.id, m.id)}
              style={{
                position: 'absolute',
                right: 4,
                top: 4,
                fontSize: 10,
                background: '#2a2a2a',
                color: '#f0f0f0',
                border: '1px solid #4a4a4a',
                borderRadius: 3,
                cursor: 'pointer',
              }}
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
