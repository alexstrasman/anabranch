import { useEffect } from 'react'
import { useStore } from './state/store'
import { CanvasView } from './canvas/CanvasView'

export default function App() {
  const initCanvas = useStore((s) => s.initCanvas)
  useEffect(() => { initCanvas() }, [initCanvas])
  return <CanvasView />
}
