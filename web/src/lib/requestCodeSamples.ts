import type { HttpMethod } from '../types'

export type RequestCodeSpec = {
  method: HttpMethod
  url: string
  /** Raw JSON string; only set when the app would send a body (POST/PUT/PATCH + non-empty valid path). */
  jsonBody?: string
}

/** Bash/zsh: wrap in single quotes; escape embedded `'` as `'\''`. */
function shellSingleQuoted(s: string): string {
  return `'${s.replace(/'/g, "'" + "\\'" + "'")}'`
}

/** C# verbatim string literal token, e.g. `@"http://..."`. */
function csharpVerbatim(s: string): string {
  return `@"${s.replace(/"/g, '""')}"`
}

const CSHARP_HTTP_METHOD: Record<HttpMethod, string> = {
  GET: 'HttpMethod.Get',
  HEAD: 'HttpMethod.Head',
  POST: 'HttpMethod.Post',
  PUT: 'HttpMethod.Put',
  PATCH: 'HttpMethod.Patch',
  DELETE: 'HttpMethod.Delete',
}

/** Python triple-double-quoted string: escape `\` at end of line and unescaped closing `"""`. */
function pythonTripleDoubleQuoted(s: string): string {
  const escaped = s.replace(/\\(?=\s*$)/gm, '\\\\').replace(/"""/g, '\\"\\"\\"')
  return `"""${escaped}"""`
}

export function buildCurlCommand(spec: RequestCodeSpec): string {
  const { method, url, jsonBody } = spec
  const parts = ['curl', '-sS', '-X', method, shellSingleQuoted(url)]
  if (jsonBody !== undefined && jsonBody.length > 0) {
    parts.push('-H', shellSingleQuoted('Content-Type: application/json'))
    parts.push('-d', shellSingleQuoted(jsonBody))
  }
  return parts.join(' ')
}

export function buildPythonSnippet(spec: RequestCodeSpec): string {
  const { method, url, jsonBody } = spec
  const lines: string[] = ['import requests  # pip install requests', '']
  const urlLit = pythonTripleDoubleQuoted(url)
  if (jsonBody !== undefined && jsonBody.length > 0) {
    const bodyLit = pythonTripleDoubleQuoted(jsonBody)
    lines.push(`url = ${urlLit}`)
    lines.push(`body = ${bodyLit}`)
    lines.push(
      `r = requests.request(${JSON.stringify(method)}, url, data=body.encode("utf-8"), headers={"Content-Type": "application/json"})`,
    )
  } else {
    lines.push(`r = requests.request(${JSON.stringify(method)}, ${urlLit})`)
  }
  lines.push('print(r.text)')
  return lines.join('\n')
}

export function buildCSharpSnippet(spec: RequestCodeSpec): string {
  const { method, url, jsonBody } = spec
  const urlCs = csharpVerbatim(url)
  const inner: string[] = [
    'using var client = new HttpClient();',
    `using var request = new HttpRequestMessage(${CSHARP_HTTP_METHOD[method]}, ${urlCs});`,
  ]
  if (jsonBody !== undefined && jsonBody.length > 0) {
    const bodyCs = csharpVerbatim(jsonBody)
    inner.push(
      `request.Content = new StringContent(${bodyCs}, Encoding.UTF8, "application/json");`,
    )
  }
  inner.push('using var response = await client.SendAsync(request);')
  inner.push('response.EnsureSuccessStatusCode();')
  inner.push('Console.WriteLine(await response.Content.ReadAsStringAsync());')

  const body = inner.map((line) => `        ${line}`).join('\n')
  return [
    'using System;',
    'using System.Net.Http;',
    'using System.Text;',
    'using System.Threading.Tasks;',
    '',
    'internal static class Program',
    '{',
    '    private static async Task Main()',
    '    {',
    body,
    '    }',
    '}',
  ].join('\n')
}

export function buildCodeSamples(spec: RequestCodeSpec): {
  curl: string
  python: string
  csharp: string
} {
  return {
    curl: buildCurlCommand(spec),
    python: buildPythonSnippet(spec),
    csharp: buildCSharpSnippet(spec),
  }
}
