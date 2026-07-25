import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow, Background, Controls, type Node, type Edge, type NodeChange, applyNodeChanges,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Thread } from '../domain/types'
import { useStore } from '../state/store'
import { ThreadNode } from './ThreadNode'

const nodeTypes = { thread: ThreadNode }

type ThreadNodeType = Node<{ thread: Thread }>

export function CanvasView() {
  const canvas = useStore((s) => s.canvas)
  const moveThreadTo = useStore((s) => s.moveThreadTo)

  // Local node state is the source of truth for React Flow during a render
  // (positions must update on every pointer move while dragging, which the
  // store does not do — see moveThreadTo below). The store is the source of
  // truth for persisted data (thread content, saved position).
  //
  // Reconciling the two: `draggingIds` tracks which nodes are mid-drag. The
  // sync effect below runs on every canvas.threads change (including once
  // per streamed token) so message content never goes stale, but for any
  // node currently in `draggingIds` it keeps the node's existing local
  // position instead of overwriting it with the (stale, pre-drag) stored
  // position. That is what stops a stream update from snapping a dragged
  // node back to its old spot mid-drag.
  const [nodes, setNodes] = useState<ThreadNodeType[]>([])
  const draggingIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    setNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]))
      return canvas.threads.map((t) => {
        const existing = prevById.get(t.id)
        const position = draggingIds.current.has(t.id) && existing ? existing.position : t.position
        return { id: t.id, type: 'thread', position, data: { thread: t } }
      })
    })
  }, [canvas.threads])

  const edges: Edge[] = useMemo(
    () => canvas.threads
      .filter((t) => t.parentId && t.branchPointMessageId)
      .map((t) => ({
        id: `e_${t.id}`,
        source: t.parentId!,
        sourceHandle: t.branchPointMessageId!,
        target: t.id,
      })),
    [canvas.threads],
  )

  const onNodesChange = useCallback((changes: NodeChange<ThreadNodeType>[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
    for (const c of changes) {
      if (c.type !== 'position') continue
      if (c.dragging) {
        draggingIds.current.add(c.id)
      } else {
        draggingIds.current.delete(c.id)
        if (c.position) moveThreadTo(c.id, c.position)
      }
    }
  }, [moveThreadTo])

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
