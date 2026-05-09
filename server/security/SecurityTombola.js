export class SecurityError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SecurityError'
  }
}

const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

// Common binary magic bytes that indicate non-text files
const BINARY_MAGIC = [
  [0xFF, 0xFE],       // UTF-16 LE BOM
  [0xFE, 0xFF],       // UTF-16 BE BOM
  [0xEF, 0xBB, 0xBF], // UTF-8 BOM (allowed but check for binary after)
  [0x25, 0x50, 0x44], // PDF (%PD)
  [0x50, 0x4B],       // ZIP/DOCX/XLSX
  [0x89, 0x50, 0x4E], // PNG
  [0xFF, 0xD8, 0xFF], // JPEG
  [0x47, 0x49, 0x46], // GIF
  [0x49, 0x49, 0x2A], // TIFF LE
  [0x4D, 0x4D, 0x00], // TIFF BE
  [0x1F, 0x8B],       // GZIP
  [0x42, 0x5A, 0x68], // BZIP2
  [0x7F, 0x45, 0x4C], // ELF
]

const ACCEPTED_MIMETYPES = new Set([
  'text/turtle',
  'application/x-turtle',
  'application/octet-stream',
  '',
])

export class SecurityTombola {
  static check(file) {
    const { originalname, mimetype, size, buffer } = file

    if (!originalname.toLowerCase().endsWith('.ttl')) {
      throw new SecurityError(`File must have a .ttl extension, got: ${originalname}`)
    }

    const mt = (mimetype || '').toLowerCase().split(';')[0].trim()
    if (!ACCEPTED_MIMETYPES.has(mt)) {
      throw new SecurityError(`Unacceptable MIME type: ${mimetype}`)
    }

    if (size > MAX_SIZE) {
      throw new SecurityError(
        `File too large: ${(size / 1024 / 1024).toFixed(1)} MB exceeds the 50 MB limit`
      )
    }

    if (!buffer || buffer.length === 0) {
      throw new SecurityError('Uploaded file is empty')
    }

    // Check for binary magic bytes
    for (const magic of BINARY_MAGIC) {
      if (buffer.length >= magic.length) {
        let match = true
        for (let i = 0; i < magic.length; i++) {
          if (buffer[i] !== magic[i]) { match = false; break }
        }
        if (match) {
          throw new SecurityError('File appears to be binary, not a UTF-8 Turtle file')
        }
      }
    }

    // Verify the content is valid UTF-8 by decoding
    try {
      const text = buffer.toString('utf-8')
      // Scan first 1024 bytes for null bytes or control chars that indicate binary
      const sample = text.slice(0, 1024)
      if (/\x00/.test(sample)) {
        throw new SecurityError('File contains null bytes — not a valid UTF-8 text file')
      }
    } catch (e) {
      if (e instanceof SecurityError) throw e
      throw new SecurityError('File is not valid UTF-8')
    }
  }
}
