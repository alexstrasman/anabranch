import { useEffect } from 'react'
import { useStore } from './state/store'
import { CanvasView } from './canvas/CanvasView'
import { KeyEntry } from './components/KeyEntry'

export default function App() {
  const initCanvas = useStore((s) => s.initCanvas)
  const apiKey = useStore((s) => s.apiKey)
  useEffect(() => { initCanvas() }, [initCanvas])
  return apiKey ? <CanvasView /> : <KeyEntry />
}
