import { useCallback, useMemo, useState } from 'react'
import { buildCodeSamples, type RequestCodeSpec } from '../lib/requestCodeSamples'

type CodeTab = 'curl' | 'python' | 'csharp'

export type RequestCodeSamplesProps = {
  spec: RequestCodeSpec
}

export function RequestCodeSamples({ spec }: RequestCodeSamplesProps) {
  const [lang, setLang] = useState<CodeTab>('curl')
  const [copyHint, setCopyHint] = useState('')

  const samples = useMemo(() => buildCodeSamples(spec), [spec])

  const activeText =
    lang === 'curl' ? samples.curl : lang === 'python' ? samples.python : samples.csharp

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeText)
      setCopyHint('Copied')
      window.setTimeout(() => setCopyHint(''), 2000)
    } catch {
      setCopyHint('Copy failed')
      window.setTimeout(() => setCopyHint(''), 3000)
    }
  }, [activeText])

  return (
    <section className="pm-code-samples" aria-label="Code samples">
      <p className="pm-code-samples__intro">
        Same URL, method, and body as <strong>Send</strong> — copy into your project or terminal.
      </p>
      <div className="pm-code-samples__toolbar">
        <div className="pm-code-samples__langs" role="tablist" aria-label="Code sample language">
          <button
            type="button"
            role="tab"
            aria-selected={lang === 'curl'}
            className={`pm-mode-btn ${lang === 'curl' ? 'pm-mode-btn--active' : ''}`}
            onClick={() => setLang('curl')}
          >
            cURL
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={lang === 'python'}
            className={`pm-mode-btn ${lang === 'python' ? 'pm-mode-btn--active' : ''}`}
            onClick={() => setLang('python')}
          >
            Python
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={lang === 'csharp'}
            className={`pm-mode-btn ${lang === 'csharp' ? 'pm-mode-btn--active' : ''}`}
            onClick={() => setLang('csharp')}
          >
            C#
          </button>
        </div>
        <div className="pm-code-samples__copy-wrap">
          <button type="button" className="pm-btn pm-btn--ghost" onClick={() => void onCopy()}>
            Copy
          </button>
          <span className="pm-code-samples__hint" aria-live="polite">
            {copyHint}
          </span>
        </div>
      </div>
      <pre className="pm-code-samples__pre" tabIndex={0}>
        {activeText}
      </pre>
    </section>
  )
}
