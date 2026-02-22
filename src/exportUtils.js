import Konva from 'konva'
import { jsPDF } from 'jspdf'

// Off-screen render resolution
const EXPORT_W = 1920
const EXPORT_H = 1080

// --- Helpers ---

function computeBounds(scene) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  for (const el of (scene.elements || [])) {
    const hw = (el.width * (el.scaleX || 1)) / 2
    const hh = (el.height * (el.scaleY || 1)) / 2
    minX = Math.min(minX, el.x - hw)
    minY = Math.min(minY, el.y - hh)
    maxX = Math.max(maxX, el.x + hw)
    maxY = Math.max(maxY, el.y + hh)
  }

  for (const shape of (scene.shapes || [])) {
    const hw = shape.width / 2, hh = shape.height / 2
    minX = Math.min(minX, shape.x - hw)
    minY = Math.min(minY, shape.y - hh)
    maxX = Math.max(maxX, shape.x + hw)
    maxY = Math.max(maxY, shape.y + hh)
  }

  for (const pt of (scene.roomPoints || [])) {
    minX = Math.min(minX, pt.x)
    minY = Math.min(minY, pt.y)
    maxX = Math.max(maxX, pt.x)
    maxY = Math.max(maxY, pt.y)
  }

  if (minX === Infinity) return { minX: 0, minY: 0, maxX: 800, maxY: 600 }
  return { minX, minY, maxX, maxY }
}

function computeViewport(bounds, canvasW, canvasH, padding = 60) {
  const contentW = bounds.maxX - bounds.minX + padding * 2
  const contentH = bounds.maxY - bounds.minY + padding * 2
  const scale = Math.min(canvasW / contentW, canvasH / contentH, 3)
  const scaledW = contentW * scale
  const scaledH = contentH * scale
  return {
    x: (canvasW - scaledW) / 2 - (bounds.minX - padding) * scale,
    y: (canvasH - scaledH) / 2 - (bounds.minY - padding) * scale,
    scale,
  }
}

// Fetch an SVG icon and return it as a data URL so it renders reliably in the
// off-screen canvas (avoids absolute-path issues under the file:// protocol).
async function fetchIconAsDataURL(iconPath) {
  if (iconPath.startsWith('data:')) return iconPath
  try {
    const url = `./icons/${encodeURIComponent(iconPath)}`
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const text = await resp.text()
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`
  } catch (e) {
    console.warn('[export] Failed to load icon:', iconPath, e)
    return null
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Render a scene into an off-screen Konva stage and return a PNG data URL
async function renderSceneToDataURL(scene, canvasW = EXPORT_W, canvasH = EXPORT_H) {
  return new Promise((resolve, reject) => {
    const container = document.createElement('div')
    container.style.cssText = `position:fixed;left:-${canvasW + 200}px;top:0;width:${canvasW}px;height:${canvasH}px;overflow:hidden;visibility:hidden;`
    document.body.appendChild(container)

    const stage = new Konva.Stage({ container, width: canvasW, height: canvasH })

    // Fit-to-content viewport
    const bounds = computeBounds(scene)
    const vp = computeViewport(bounds, canvasW, canvasH)
    stage.scale({ x: vp.scale, y: vp.scale })
    stage.position({ x: vp.x, y: vp.y })

    // Background
    const bgLayer = new Konva.Layer()
    bgLayer.add(new Konva.Rect({
      x: -vp.x / vp.scale - 5000,
      y: -vp.y / vp.scale - 5000,
      width: 10000 + canvasW / vp.scale,
      height: 10000 + canvasH / vp.scale,
      fill: 'white',
      listening: false,
    }))
    stage.add(bgLayer)

    // Blueprint layer
    const bpLayer = new Konva.Layer()

    if ((scene.roomPoints || []).length >= 2) {
      const pts = scene.roomPoints.flatMap(p => [p.x, p.y])
      bpLayer.add(new Konva.Line({
        points: pts,
        stroke: '#334155',
        strokeWidth: 3,
        closed: !!scene.roomClosed,
        fill: scene.roomClosed ? 'rgba(226,232,240,0.4)' : undefined,
        listening: false,
      }))
    }

    for (const shape of (scene.shapes || [])) {
      const g = new Konva.Group({ x: shape.x, y: shape.y, rotation: shape.rotation || 0, listening: false })
      const props = { fill: shape.fill, stroke: shape.stroke, strokeWidth: shape.strokeWidth }
      if (shape.shapeType === 'rect') {
        g.add(new Konva.Rect({ width: shape.width, height: shape.height, offsetX: shape.width / 2, offsetY: shape.height / 2, ...props }))
      } else if (shape.shapeType === 'circle') {
        g.add(new Konva.Circle({ radius: Math.min(shape.width, shape.height) / 2, ...props }))
      } else if (shape.shapeType === 'triangle') {
        g.add(new Konva.RegularPolygon({ sides: 3, radius: Math.min(shape.width, shape.height) / 2, ...props }))
      }
      if (shape.label) {
        // Center the label inside the shape, matching the live-canvas rendering.
        g.add(new Konva.Text({
          text: shape.label, fontSize: 12, fill: '#333',
          width: shape.width, height: shape.height,
          offsetX: shape.width / 2, offsetY: shape.height / 2,
          align: 'center', verticalAlign: 'middle', listening: false,
        }))
      }
      bpLayer.add(g)
    }
    stage.add(bpLayer)

    // Lighting elements layer
    const lightLayer = new Konva.Layer()
    const sortedEls = [...(scene.elements || [])].sort((a, b) => a.zIndex - b.zIndex)
    const imgPromises = []

    for (const el of sortedEls) {
      const g = new Konva.Group({
        x: el.x, y: el.y,
        rotation: el.rotation || 0,
        scaleX: el.scaleX || 1,
        scaleY: el.scaleY || 1,
        listening: false,
      })
      const hw = el.width / 2, hh = el.height / 2

      const p = fetchIconAsDataURL(el.iconPath).then((dataURL) => new Promise((res) => {
        if (!dataURL) {
          g.add(new Konva.Rect({ width: el.width, height: el.height, offsetX: hw, offsetY: hh, fill: 'rgba(100,120,200,0.25)', stroke: 'rgba(100,120,200,0.5)', strokeWidth: 1, listening: false }))
          return res()
        }
        const img = new Image()
        img.onload = () => {
          g.add(new Konva.Image({ image: img, width: el.width, height: el.height, offsetX: hw, offsetY: hh, listening: false }))
          res()
        }
        img.onerror = () => {
          g.add(new Konva.Rect({ width: el.width, height: el.height, offsetX: hw, offsetY: hh, fill: 'rgba(100,120,200,0.25)', stroke: 'rgba(100,120,200,0.5)', strokeWidth: 1, listening: false }))
          res()
        }
        img.src = dataURL
      }))
      imgPromises.push(p)

      const infoLines = [el.label, el.accessories, el.colorTemperature, el.notes].filter(Boolean)
      if (infoLines.length > 0) {
        const sx = el.scaleX || 1
        const sy = el.scaleY || 1
        // Circumscribed circle radius — farthest any corner can be from center.
        // Using this as the minimum offset guarantees notes clear the icon at
        // every rotation angle, with 14 px of additional padding.
        const halfDiag = Math.sqrt(
          (el.width  * sx / 2) ** 2 +
          (el.height * sy / 2) ** 2
        )
        const d = halfDiag + 14
        const textW = Math.max(el.width, 80)
        // Notes are rendered as a sibling node (NOT inside the rotating icon
        // group) at a fixed canvas position: directly below the icon's center.
        // No rotation — notes are always upright regardless of icon rotation.
        lightLayer.add(new Konva.Text({
          x: el.x,
          y: el.y + d,
          text: infoLines.join('\n'), fontSize: 11, fill: '#1e293b',
          align: 'center', width: textW, offsetX: textW / 2,
          fontFamily: 'sans-serif', lineHeight: 1.35, listening: false,
        }))
      }
      lightLayer.add(g)
    }
    stage.add(lightLayer)

    Promise.all(imgPromises)
      .then(() => {
        // draw() is synchronous — ensures canvas is rendered before toDataURL
        stage.draw()
        const dataURL = stage.toDataURL({ pixelRatio: 1 })
        stage.destroy()
        document.body.removeChild(container)
        resolve(dataURL)
      })
      .catch((err) => {
        try { stage.destroy(); document.body.removeChild(container) } catch {}
        reject(err)
      })
  })
}

function buildPDFPage(pdf, imgData, sceneName) {
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 15
  const titleH = 14

  // Title
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text(sceneName, margin, margin + 8)

  // Thin rule under title
  pdf.setDrawColor(180, 180, 180)
  pdf.setLineWidth(0.3)
  pdf.line(margin, margin + titleH - 1, pageW - margin, margin + titleH - 1)

  // Image
  const imgMaxW = pageW - margin * 2
  const imgMaxH = pageH - margin - titleH - margin
  const ratio = EXPORT_W / EXPORT_H
  let imgW = imgMaxW
  let imgH = imgW / ratio
  if (imgH > imgMaxH) { imgH = imgMaxH; imgW = imgH * ratio }

  pdf.addImage(imgData, 'PNG', margin, margin + titleH, imgW, imgH)
}

// --- Public API ---

export async function exportScenePNG(scene) {
  const dataURL = await renderSceneToDataURL(scene, EXPORT_W, EXPORT_H)
  // Strip "data:image/png;base64," prefix
  return dataURL.split(',')[1]
}

export async function exportScenePDF(scene) {
  const imgData = await renderSceneToDataURL(scene, EXPORT_W, EXPORT_H)
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  buildPDFPage(pdf, imgData, scene.name)
  return arrayBufferToBase64(pdf.output('arraybuffer'))
}

export async function exportAllScenesPDF(scenes) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  for (let i = 0; i < scenes.length; i++) {
    if (i > 0) pdf.addPage()
    const imgData = await renderSceneToDataURL(scenes[i], EXPORT_W, EXPORT_H)
    buildPDFPage(pdf, imgData, scenes[i].name)
  }
  return arrayBufferToBase64(pdf.output('arraybuffer'))
}

// Returns an array of { name, base64Data } — one per scene — for saving as individual PNGs
export async function exportAllScenesPNG(scenes) {
  return Promise.all(scenes.map(async (scene) => {
    const dataURL = await renderSceneToDataURL(scene, EXPORT_W, EXPORT_H)
    const safeName = scene.name.replace(/[^a-z0-9_-]/gi, '_') + '.png'
    return { name: safeName, base64Data: dataURL.split(',')[1] }
  }))
}
