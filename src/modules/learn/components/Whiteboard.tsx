import React, { useRef, useState, useEffect } from 'react'
import { 
  Pencil, 
  Square, 
  Circle, 
  Eraser, 
  Trash2, 
  Undo2, 
  Redo2, 
  Minus,
  Share2,
  ImageUp
} from 'lucide-react'

export interface WhiteboardElement {
  type: 'line' | 'rect' | 'circle' | 'text' | 'plot'
  x1?: number
  y1?: number
  x2?: number
  y2?: number
  x?: number
  y?: number
  w?: number
  h?: number
  r?: number
  text?: string
  formula?: string
  color?: string
  label?: string
}

interface WhiteboardProps {
  onAttachImage: (dataUrl: string) => void
  agentElements?: WhiteboardElement[]
}

export function Whiteboard({ onAttachImage, agentElements = [] }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [tool, setTool] = useState<'pencil' | 'line' | 'rectangle' | 'circle' | 'eraser'>('pencil')
  const [color, setColor] = useState('#111111')
  const [lineWidth, setLineWidth] = useState(2)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [snapshot, setSnapshot] = useState<ImageData | null>(null)
  
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Draw grid background on canvas
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Read theme background color from style
    ctx.fillStyle = 'var(--bg-primary, #ffffff)'
    ctx.fillRect(0, 0, width, height)

    // Set dotted grid pattern
    ctx.fillStyle = 'var(--border-strong, #cbd5e1)'
    const gap = 20
    for (let x = gap; x < width; x += gap) {
      for (let y = gap; y < height; y += gap) {
        ctx.fillRect(x, y, 1.5, 1.5)
      }
    }
  }

  // Draw Agent Visualizations on top of canvas
  const drawAgentElements = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!agentElements || agentElements.length === 0) return

    agentElements.forEach(element => {
      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      const themeColor = element.color || 'var(--text-primary, #111111)'
      ctx.strokeStyle = themeColor
      ctx.fillStyle = themeColor

      if (element.type === 'line') {
        ctx.moveTo(element.x1 ?? 0, element.y1 ?? 0)
        ctx.lineTo(element.x2 ?? 100, element.y2 ?? 100)
        ctx.stroke()
        if (element.label) {
          ctx.font = '10px sans-serif'
          ctx.fillText(element.label, ((element.x1 ?? 0) + (element.x2 ?? 100)) / 2 + 5, ((element.y1 ?? 0) + (element.y2 ?? 100)) / 2 - 5)
        }
      } else if (element.type === 'rect') {
        ctx.strokeRect(element.x ?? 0, element.y ?? 0, element.w ?? 50, element.h ?? 50)
        if (element.label) {
          ctx.font = '10px sans-serif'
          ctx.fillText(element.label, (element.x ?? 0) + 5, (element.y ?? 0) - 5)
        }
      } else if (element.type === 'circle') {
        ctx.arc(element.x ?? 50, element.y ?? 50, element.r ?? 30, 0, 2 * Math.PI)
        ctx.stroke()
        if (element.label) {
          ctx.font = '10px sans-serif'
          ctx.fillText(element.label, (element.x ?? 50) - 10, (element.y ?? 50) - (element.r ?? 30) - 5)
        }
      } else if (element.type === 'text') {
        ctx.font = '11px sans-serif'
        ctx.fillText(element.text ?? '', element.x ?? 50, element.y ?? 50)
      } else if (element.type === 'plot') {
        // Plot graph coordinate axis centered on canvas
        const centerX = width / 2
        const centerY = height / 2
        
        ctx.beginPath()
        ctx.strokeStyle = 'var(--border-strong, #cbd5e1)'
        ctx.lineWidth = 1
        // X-Axis
        ctx.moveTo(15, centerY)
        ctx.lineTo(width - 15, centerY)
        // Y-Axis
        ctx.moveTo(centerX, 15)
        ctx.lineTo(centerX, height - 15)
        ctx.stroke()

        // Plot function curves
        ctx.beginPath()
        ctx.strokeStyle = '#dc2626' // Red curves for high visual contrast
        ctx.lineWidth = 2
        
        const scaleX = 40 // Pixels per unit
        const scaleY = 40
        
        let first = true
        for (let pixelX = 20; pixelX < width - 20; pixelX++) {
          const mathX = (pixelX - centerX) / scaleX
          let mathY = 0
          
          try {
            if (element.formula === 'sin(x)') {
              mathY = Math.sin(mathX)
            } else if (element.formula === 'cos(x)') {
              mathY = Math.cos(mathX)
            } else if (element.formula === 'x^2' || element.formula === 'x*x') {
              mathY = mathX * mathX
            } else if (element.formula === 'exp(x)' || element.formula === 'e^x') {
              mathY = Math.exp(mathX)
            } else if (element.formula === 'log(x)' || element.formula === 'ln(x)') {
              mathY = Math.log(mathX)
            } else {
              mathY = mathX // identity line y = x
            }
          } catch (e) {
            continue
          }

          const pixelY = centerY - (mathY * scaleY)
          if (pixelY >= 15 && pixelY <= height - 15) {
            if (first) {
              ctx.moveTo(pixelX, pixelY)
              first = false
            } else {
              ctx.lineTo(pixelX, pixelY)
            }
          }
        }
        ctx.stroke()
        
        ctx.fillStyle = '#dc2626'
        ctx.font = 'italic 10px sans-serif'
        ctx.fillText(`y = ${element.formula}`, centerX + 12, 35)
      }
    })
  }

  // Redraw complete canvas (grid + user sketch + agent drawings)
  const redraw = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawGrid(ctx, canvas.width, canvas.height)

    if (history[historyIndex]) {
      const img = new Image()
      img.src = history[historyIndex]
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        drawAgentElements(ctx, canvas.width, canvas.height)
      }
    } else {
      drawAgentElements(ctx, canvas.width, canvas.height)
    }
  }

  // Handle canvas sizing and responsiveness
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dataUrl = canvas.toDataURL()
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = Math.max(380, rect.height - 70) // Subtract toolbar height

      const img = new Image()
      img.src = dataUrl
      img.onload = () => {
        drawGrid(ctx, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        drawAgentElements(ctx, canvas.width, canvas.height)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    // Set initial history
    setTimeout(() => {
      const canvas = canvasRef.current
      if (canvas) {
        const initialData = canvas.toDataURL()
        setHistory([initialData])
        setHistoryIndex(0)
      }
    }, 100)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Trigger redraw reactively whenever history index or agent elements change
  useEffect(() => {
    redraw()
  }, [historyIndex, agentElements])

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const pos = getMousePos(e)
    setStartPos(pos)
    setIsDrawing(true)

    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (tool === 'pencil') {
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    } else if (tool === 'eraser') {
      ctx.strokeStyle = 'var(--bg-primary, #ffffff)' // Matches theme background
      ctx.lineWidth = lineWidth * 4
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    } else {
      ctx.strokeStyle = color
      setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const pos = getMousePos(e)

    if (tool === 'pencil' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    } else if (snapshot) {
      ctx.putImageData(snapshot, 0, 0)
      ctx.beginPath()
      ctx.lineWidth = lineWidth
      ctx.strokeStyle = color

      if (tool === 'line') {
        ctx.moveTo(startPos.x, startPos.y)
        ctx.lineTo(pos.x, pos.y)
      } else if (tool === 'rectangle') {
        const width = pos.x - startPos.x
        const height = pos.y - startPos.y
        ctx.strokeRect(startPos.x, startPos.y, width, height)
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2))
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
      }
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    setSnapshot(null)

    const canvas = canvasRef.current
    if (canvas) {
      const dataUrl = canvas.toDataURL()
      const newHistory = history.slice(0, historyIndex + 1)
      setHistory([...newHistory, dataUrl])
      setHistoryIndex(newHistory.length)
    }
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1)
    }
  }

  const imageInputRef = useRef<HTMLInputElement>(null)

  const loadImageToCanvas = (dataUrl: string) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const img = new Image()
    img.onload = () => {
      // Scale image to fit canvas while preserving aspect ratio
      const maxW = canvas.width * 0.85
      const maxH = canvas.height * 0.85
      let w = img.width
      let h = img.height
      if (w > maxW) { h = h * (maxW / w); w = maxW }
      if (h > maxH) { w = w * (maxH / h); h = maxH }
      const x = (canvas.width - w) / 2
      const y = (canvas.height - h) / 2
      ctx.drawImage(img, x, y, w, h)

      const newDataUrl = canvas.toDataURL()
      const newHistory = history.slice(0, historyIndex + 1)
      setHistory([...newHistory, newDataUrl])
      setHistoryIndex(newHistory.length)
    }
    img.src = dataUrl
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    drawGrid(ctx, canvas.width, canvas.height)
    
    const dataUrl = canvas.toDataURL()
    const newHistory = history.slice(0, historyIndex + 1)
    setHistory([...newHistory, dataUrl])
    setHistoryIndex(newHistory.length)
  }

  const attachToChat = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const dataUrl = canvas.toDataURL()
      onAttachImage(dataUrl)
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[var(--bg-surface-100)] border border-[var(--border-subtle)] rounded-lg overflow-hidden select-none">
      
      {/* Mini Whiteboard Toolbar */}
      <div className="h-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTool('pencil')}
            className={`p-1.5 rounded transition-all ${tool === 'pencil' ? 'bg-[var(--bg-surface-200)] text-[var(--text-primary)] border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            title="Kalem"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTool('line')}
            className={`p-1.5 rounded transition-all ${tool === 'line' ? 'bg-[var(--bg-surface-200)] text-[var(--text-primary)] border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            title="Düz Çizgi"
          >
            <Minus className="h-4 w-4 -rotate-45" />
          </button>
          <button
            onClick={() => setTool('rectangle')}
            className={`p-1.5 rounded transition-all ${tool === 'rectangle' ? 'bg-[var(--bg-surface-200)] text-[var(--text-primary)] border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            title="Dikdörtgen"
          >
            <Square className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-1.5 rounded transition-all ${tool === 'circle' ? 'bg-[var(--bg-surface-200)] text-[var(--text-primary)] border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            title="Daire"
          >
            <Circle className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded transition-all ${tool === 'eraser' ? 'bg-[var(--bg-surface-200)] text-[var(--text-primary)] border border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            title="Silgi"
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Stroke Colors */}
          <div className="flex items-center gap-1">
            {['var(--text-primary)', '#2563eb', '#dc2626', '#16a34a'].map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c)
                  if (tool === 'eraser') setTool('pencil')
                }}
                className={`h-4.5 w-4.5 rounded-full border border-white ring-1 transition-all ${color === c && tool !== 'eraser' ? 'ring-slate-400 scale-110' : 'ring-transparent'}`}
                style={{ backgroundColor: c.startsWith('var') ? 'black' : c }}
              />
            ))}
          </div>

          <div className="h-4 w-px bg-[var(--border-subtle)]" />

          {/* Undo/Redo/Clear & Share */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none"
              title="Geri Al"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:pointer-events-none"
              title="İleri Al"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button
              onClick={clearCanvas}
              className="p-1.5 rounded text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-50/50"
              title="Temizle"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Resim Ekle"
            >
              <ImageUp className="h-4 w-4" />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (ev) => {
                  const dataUrl = ev.target?.result as string
                  loadImageToCanvas(dataUrl)
                }
                reader.readAsDataURL(file)
                e.target.value = ''
              }}
            />
            <button
              onClick={attachToChat}
              className="ml-1.5 flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 text-2xs font-bold transition-all"
              title="Çizimi Sohbete Ekle"
            >
              <Share2 className="h-3 w-3" />
              Sohbete Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="flex-1 bg-[var(--bg-primary)] touch-none cursor-crosshair"
      />
    </div>
  )
}
