import { createClient } from '@supabase/supabase-js'
import { callLLM } from './lib/llmClient'

export const config = {
  runtime: 'edge',
}

const MINDMAP_SYSTEM_PROMPT = `Sen STEMA (Sokratik STEM Öğrenme Platformu) bünyesinde çalışan yapay zeka tabanlı bir Zihin Haritası (Mindmap) Üreticisisin.
Görevin, kullanıcının belirttiği STEM konusunu derinlemesine analiz ederek, konunun kavramsal hiyerarşisini gösteren bir zihin haritası yapısı üretmektir.

Zihin haritası yapısı:
- En tepede ana konu (Root) bulunmalı.
- Ana konudan en az 3 adet 1. seviye alt dal (Level 1) çıkmalı.
- Her 1. seviye daldan da en az 2 adet 2. seviye alt dal (Level 2) çıkmalı.

Yanıtını KESİNLİKLE sadece JSON formatında vermelisin. Başka hiçbir açıklama, markdown kodu veya etiket ekleme. JSON yapısı şu formatta olmalıdır:
{
  "label": "Ana Konu Adı",
  "children": [
    {
      "label": "1. Seviye Alt Dal 1",
      "children": [
        { "label": "2. Seviye Alt Dal 1.1" },
        { "label": "2. Seviye Alt Dal 1.2" }
      ]
    },
    ...
  ]
}
`

const EXPAND_NODE_SYSTEM_PROMPT = `Sen STEMA bünyesinde çalışan Zihin Haritası Genişleticisisin.
Görevin, kullanıcının seçtiği belirli bir düğüm (node) başlığı altında yeni detaylandırıcı alt dallar üretmektir.

Seçilen düğüm başlığından en az 2 veya 3 adet alt dal (children) türetmelisin.

Yanıtını KESİNLİKLE sadece JSON formatında vermelisin. Başka hiçbir açıklama, markdown kodu veya etiket ekleme. JSON yapısı şu formatta olmalıdır:
{
  "label": "Seçilen Düğüm Başlığı",
  "children": [
    { "label": "Detaylı Alt Dal 1" },
    { "label": "Detaylı Alt Dal 2" },
    { "label": "Detaylı Alt Dal 3" }
  ]
}
`

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { prompt, isExpand, nodeLabel } = await req.json() as {
      prompt: string
      isExpand?: boolean
      nodeLabel?: string
    }

    if (!prompt && !nodeLabel) {
      return new Response(JSON.stringify({ error: 'Prompt or node label is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let mindmapJSON: any = null

    const systemPrompt = isExpand ? EXPAND_NODE_SYSTEM_PROMPT : MINDMAP_SYSTEM_PROMPT
    const userPrompt = isExpand 
      ? `Genişletilecek Düğüm: "${nodeLabel}"\nLütfen bu düğümün altına yerleştirilebilecek yeni alt dalları JSON formatında türet.`
      : `Zihin Haritası Konusu: "${prompt}"\nLütfen bu konuyla ilgili zihin haritası yapısını JSON formatında üret.`

    try {
      const result = await callLLM({
        taskType: isExpand ? 'mindmap-expand' : 'mindmap',
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })

      if (result.content) {
        mindmapJSON = parseJSON(result.content)
      }
    } catch (err) {
      console.error('Mindmap LLM call failed, using mock:', err)
    }

    if (!mindmapJSON) {
      mindmapJSON = getMockMindmap(isExpand ? nodeLabel || prompt : prompt, isExpand || false)
    }

    // Normalize mindmapJSON if it is valid but has malformed layout structure
    if (Array.isArray(mindmapJSON)) {
      mindmapJSON = {
        label: prompt || 'STEM',
        children: mindmapJSON
      }
    } else if (typeof mindmapJSON === 'object' && mindmapJSON !== null) {
      if (!mindmapJSON.label) {
        const keys = Object.keys(mindmapJSON)
        if (keys.length === 1 && typeof mindmapJSON[keys[0]] === 'object' && mindmapJSON[keys[0]] !== null) {
          mindmapJSON = mindmapJSON[keys[0]]
        }
      }
      if (!mindmapJSON.label) {
        mindmapJSON.label = prompt || 'STEM'
      }
    } else {
      mindmapJSON = getMockMindmap(isExpand ? nodeLabel || 'STEM' : prompt, isExpand)
    }

    // Convert the tree JSON to flat nodes & edges with automatic layout
    const formatted = formatMindmapTree(mindmapJSON)

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Mindmap API error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function parseJSON(text: string | null): any {
  if (!text) return null
  try {
    let cleanText = text.trim()
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/```$/, '').trim()
    }
    return JSON.parse(cleanText)
  } catch (e) {
    console.error('Failed to parse mindmap JSON:', e)
    return null
  }
}

// Layout parameters
const VERTICAL_SPACING = 145
const HORIZONTAL_SPACING = 240

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

function formatMindmapTree(tree: any) {
  const flatNodes: FlatNode[] = []
  const flatEdges: FlatEdge[] = []
  let horizontalCounter = 0

  function traverse(node: any, depth = 0, parentId?: string): number {
    if (!node) return 50
    const label = typeof node === 'string' ? node : (node.label || 'Kavram')
    const currentId = parentId ? `${parentId}-${cleanId(label)}` : 'root'
    const currentY = depth * VERTICAL_SPACING + 50

    const children = (node && Array.isArray(node.children)) ? node.children : []

    if (children.length === 0) {
      const currentX = horizontalCounter * HORIZONTAL_SPACING + 50
      horizontalCounter++
      flatNodes.push({
        id: currentId,
        data: { label },
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
    children.forEach((child: any) => {
      const childX = traverse(child, depth + 1, currentId)
      childXPositions.push(childX)
    })

    const parentX = childXPositions.reduce((a, b) => a + b, 0) / childXPositions.length
    flatNodes.push({
      id: currentId,
      data: { label },
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

function cleanId(label: any): string {
  const str = String(label || 'node')
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10) + Math.random().toString(36).substring(2, 5)
}

function getMockMindmap(subject: string, isExpand = false): any {
  if (isExpand) {
    return {
      label: subject,
      children: [
        { label: `${subject} Tanımı ve Kapsamı` },
        { label: `${subject} Uygulama Örnekleri` },
        { label: `${subject} Temel Kuralları` }
      ]
    }
  }

  return {
    label: subject,
    children: [
      {
        label: `${subject} Giriş`,
        children: [
          { label: `Temel Prensipler` },
          { label: `Gerekli Önkoşullar` }
        ]
      },
      {
        label: `${subject} Teoremleri`,
        children: [
          { label: `Birinci Teorem` },
          { label: `İkinci Teorem` }
        ]
      },
      {
        label: `${subject} Pratik Analiz`,
        children: [
          { label: `Problem Çözüm Adımları` },
          { label: `Sık Yapılan Hatalar` }
        ]
      }
    ]
  }
}
