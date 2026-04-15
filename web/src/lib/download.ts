export function downloadTextFile(filename: string, contents: string, mime: string): void {
  const blob = new Blob([contents], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function downloadJson(filename: string, data: unknown): void {
  downloadTextFile(filename, `${JSON.stringify(data, null, 2)}\n`, 'application/json')
}
