import PDFDocument from 'pdfkit'

export function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}

export async function fetchUrl(url: string): Promise<Buffer> {
  const res = await fetch(url)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

export { PDFDocument }
