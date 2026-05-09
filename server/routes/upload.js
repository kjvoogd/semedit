import { Router } from 'express'
import multer from 'multer'
import { driver } from '../db.js'
import { SecurityTombola, SecurityError } from '../security/SecurityTombola.js'
import { loadFile } from '../services/memgraphLoader.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
})

router.post('/upload', (req, res) => {
  upload.single('file')(req, res, async (multerErr) => {
    if (multerErr) {
      const msg = multerErr.message || 'File upload error'
      console.log('[upload] multer error:', msg)
      return res.status(400).json({ ok: false, error: msg })
    }

    const file = req.file
    if (!file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded' })
    }

    try {
      SecurityTombola.check(file)
    } catch (e) {
      if (e instanceof SecurityError) {
        console.log(`[upload] security rejected: ${file.originalname} — ${e.message}`)
        return res.status(400).json({ ok: false, error: e.message })
      }
      console.error('[upload] unexpected security check error:', e.message)
      return res.status(500).json({ ok: false, error: e.message })
    }

    try {
      console.log(`[upload] received: ${file.originalname} (${file.size} bytes)`)
      const result = await loadFile(driver, file.originalname, file.buffer)
      const nodeCount = result.schemeCount + result.conceptCount
      return res.json({ ok: true, ...result, nodeCount })
    } catch (e) {
      console.error(`[upload] load error: ${file.originalname} —`, e.message)
      return res.status(500).json({ ok: false, error: e.message })
    }
  })
})

router.get('/tree', async (req, res) => {
  const session = driver.session()
  try {
    // Find the most recently loaded graph
    const graphResult = await session.run(
      'MATCH (g:NamedGraph) RETURN g.label AS label, g.uri AS uri ORDER BY g.loadedAt DESC LIMIT 1'
    )

    if (graphResult.records.length === 0) {
      console.log('[tree] returning 0 root nodes')
      return res.json([])
    }

    const graphLabel = graphResult.records[0].get('label')

    // Load all concepts and their broader relationships within this graph
    const conceptsResult = await session.run(
      `MATCH (n:Concept { graph: $graph })
       OPTIONAL MATCH (n)-[:BROADER]->(parent:Concept)
       OPTIONAL MATCH (n)-[:IN_SCHEME]->(scheme:ConceptScheme)
       RETURN n.uri AS uri, n.prefLabel_en AS label_en, n.prefLabel_nl AS label_nl,
              parent.uri AS parentUri, scheme.uri AS schemeUri`,
      { graph: graphLabel }
    )

    // Also load ConceptSchemes as top-level roots
    const schemesResult = await session.run(
      `MATCH (s:ConceptScheme { graph: $graph })
       RETURN s.uri AS uri, s.prefLabel_en AS label_en, s.prefLabel_nl AS label_nl`,
      { graph: graphLabel }
    )

    // Build a flat map: uri → { id, label, parentId }
    const flat = new Map()

    for (const rec of schemesResult.records) {
      const uri = rec.get('uri')
      flat.set(uri, {
        id:       uri,
        label:    rec.get('label_en') || rec.get('label_nl') || uri.split(/[/#]/).pop(),
        parentId: null,
      })
    }

    for (const rec of conceptsResult.records) {
      const uri      = rec.get('uri')
      const parentUri = rec.get('parentUri')
      const schemeUri = rec.get('schemeUri')
      const existingParentId = flat.has(uri) ? flat.get(uri).parentId : undefined

      flat.set(uri, {
        id:       uri,
        label:    rec.get('label_en') || rec.get('label_nl') || uri.split(/[/#]/).pop(),
        parentId: existingParentId ?? parentUri ?? schemeUri ?? null,
      })
    }

    // Convert flat map to nested TreeItem[]
    const roots = []
    const nodeMap = new Map()

    for (const [id, item] of flat) {
      nodeMap.set(id, { id: item.id, label: item.label, children: [] })
    }

    for (const [id, item] of flat) {
      const node = nodeMap.get(id)
      if (item.parentId && nodeMap.has(item.parentId)) {
        nodeMap.get(item.parentId).children.push(node)
      } else {
        roots.push(node)
      }
    }

    // Strip empty children arrays
    function pruneChildren(node) {
      if (node.children.length === 0) {
        delete node.children
      } else {
        node.children.forEach(pruneChildren)
      }
      return node
    }

    const tree = roots.map(pruneChildren)
    console.log(`[tree] returning ${roots.length} root nodes`)
    return res.json(tree)
  } catch (e) {
    console.error('[tree] error:', e.message)
    return res.status(500).json({ ok: false, error: e.message })
  } finally {
    await session.close()
  }
})

export default router
