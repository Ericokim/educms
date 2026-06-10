import fs from 'node:fs/promises'

type SignatureCheck = (bytes: Buffer) => boolean

/**
 * Magic-byte checks for every MIME type the upload whitelist allows.
 * The client-supplied Content-Type chooses the branch; the file content
 * must actually match it.
 */
const SIGNATURES: Record<string, SignatureCheck> = {
  'image/jpeg': (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.length >= 4 && b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
  'image/gif': (b) => b.length >= 4 && b.subarray(0, 4).toString('latin1') === 'GIF8',
  'image/webp': (b) =>
    b.length >= 12 &&
    b.subarray(0, 4).toString('latin1') === 'RIFF' &&
    b.subarray(8, 12).toString('latin1') === 'WEBP',
  'application/pdf': (b) => b.length >= 4 && b.subarray(0, 4).toString('latin1') === '%PDF',
}

/** Reads the first bytes of a file and verifies they match the claimed MIME type. */
export async function fileMatchesMimeType(
  filePath: string,
  mimeType: string
): Promise<boolean> {
  const check = SIGNATURES[mimeType]
  if (!check) return false

  const handle = await fs.open(filePath, 'r')
  try {
    const buffer = Buffer.alloc(16)
    const { bytesRead } = await handle.read(buffer, 0, 16, 0)
    return check(buffer.subarray(0, bytesRead))
  } finally {
    await handle.close()
  }
}
