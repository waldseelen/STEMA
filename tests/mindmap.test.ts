import { describe, it, expect } from 'vitest'

// We mimic the formatMindmapTree from api/mindmap.ts to unit test the algorithm
const VERTICAL_SPACING = 120
const HORIZONTAL_SPACING = 160

interface FlatNode {
  id: string
  data: { label: string }
  position: { x: number; y: number }
}

interface FlatEdge {
  id: string
  source: string
  target: string
  animated: boolean
}

function cleanId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10)
}

function formatMindmapTree(tree: any) {
  const flatNodes: FlatNode[] = []
  const flatEdges: FlatEdge[] = []
  let horizontalCounter = 0

  function traverse(node: any, depth = 0, parentId?: string): number {
    const currentId = parentId ? `${parentId}-${cleanId(node.label)}` : 'root'
    const currentY = depth * VERTICAL_SPACING + 50

    if (!node.children || node.children.length === 0) {
      const currentX = horizontalCounter * HORIZONTAL_SPACING + 50
      horizontalCounter++
      flatNodes.push({
        id: currentId,
        data: { label: node.label },
        position: { x: currentX, y: currentY }
      })
      if (parentId) {
        flatEdges.push({
          id: `edge-${parentId}-${currentId}`,
          source: parentId,
          target: currentId,
          animated: true
        })
      }
      return currentX
    }

    const childXPositions: number[] = []
    node.children.forEach((child: any) => {
      const childX = traverse(child, depth + 1, currentId)
      childXPositions.push(childX)
    })

    const parentX = childXPositions.reduce((a, b) => a + b, 0) / childXPositions.length
    flatNodes.push({
      id: currentId,
      data: { label: node.label },
      position: { x: parentX, y: currentY }
    })

    if (parentId) {
      flatEdges.push({
        id: `edge-${parentId}-${currentId}`,
        source: parentId,
        target: currentId,
        animated: true
      })
    }

    return parentX
  }

  traverse(tree)
  return { nodes: flatNodes, edges: flatEdges }
}

describe('AI Mindmap layout formatting algorithm', () => {
  it('should correctly format a single node tree', () => {
    const tree = { label: 'Limit' }
    const result = formatMindmapTree(tree)

    expect(result.nodes).toHaveLength(1)
    expect(result.edges).toHaveLength(0)
    expect(result.nodes[0].id).toBe('root')
    expect(result.nodes[0].position.x).toBe(50)
    expect(result.nodes[0].position.y).toBe(50)
  })

  it('should position parent at the center of children horizontally', () => {
    const tree = {
      label: 'Ana Konu',
      children: [
        { label: 'Alt Konu 1' },
        { label: 'Alt Konu 2' }
      ]
    }
    const result = formatMindmapTree(tree)

    // Children are leaves, so they are processed first:
    // Alt Konu 1: x = 50, y = 170
    // Alt Konu 2: x = 210, y = 170
    // Parent: x = (50 + 210) / 2 = 130, y = 50
    expect(result.nodes).toHaveLength(3)
    expect(result.edges).toHaveLength(2)

    const parent = result.nodes.find(n => n.id === 'root')
    expect(parent).toBeDefined()
    expect(parent?.position.x).toBe(130)
    expect(parent?.position.y).toBe(50)
  })

  it('should clean labels to valid sub-ids', () => {
    expect(cleanId('Mitoz ve Mayoz! Part 1')).toBe('mitozvemay')
    expect(cleanId('Newton\'s Second Law')).toBe('newtonssec')
  })

  it('should run the api handler successfully with mock request', async () => {
    const handler = (await import('../api/mindmap')).default
    const req = new Request('http://localhost:3000/api/mindmap', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'Newton Laws' }),
      headers: { 'Content-Type': 'application/json' }
    })
    const res = await handler(req)
    const json = await res.json()
    console.log('API Handler JSON response:', JSON.stringify(json, null, 2))
    expect(res.status).toBe(200)
    expect(json.nodes).toBeDefined()
  })
})
