import type { ResponseMeta } from '../types'

export type ResponseViewerProps = {
  fetchError: string
  preview: string
  rawBody: string
  bodyView: 'pretty' | 'raw'
  responseMeta: ResponseMeta | null
  onBodyViewChange: (v: 'pretty' | 'raw') => void
}

export function ResponseViewer({
  fetchError,
  preview,
  rawBody,
  bodyView,
  responseMeta,
  onBodyViewChange,
}: ResponseViewerProps) {
  return (
    <section className="pm-response" aria-label="Response">
      <div className="pm-response__head">
        <span className="pm-response__title">Response</span>
        <div className="pm-response__chips">
          {responseMeta && (
            <>
              <span
                className={`pm-chip ${responseMeta.status >= 400 ? 'pm-chip--err' : 'pm-chip--ok'}`}
              >
                {responseMeta.status} {responseMeta.statusText}
              </span>
              <span className="pm-chip pm-chip--muted">{responseMeta.timeMs} ms</span>
              <span className="pm-chip pm-chip--muted">
                {(responseMeta.sizeBytes / 1024).toFixed(1)} KB
              </span>
            </>
          )}
        </div>
        <div className="pm-response__tabs">
          <button
            type="button"
            className={`pm-subtab ${bodyView === 'pretty' ? 'pm-subtab--active' : ''}`}
            onClick={() => onBodyViewChange('pretty')}
          >
            Pretty
          </button>
          <button
            type="button"
            className={`pm-subtab ${bodyView === 'raw' ? 'pm-subtab--active' : ''}`}
            onClick={() => onBodyViewChange('raw')}
          >
            Raw
          </button>
        </div>
      </div>
      <div className="pm-response__body">
        {fetchError && !preview && (
          <pre className="pm-code pm-code--err" role="alert">
            {fetchError}
          </pre>
        )}
        {preview && <pre className="pm-code">{bodyView === 'pretty' ? preview : rawBody}</pre>}
        {!preview && !fetchError && (
          <div className="pm-response__empty">
            <p className="pm-response__empty-title">No response yet</p>
            <p className="pm-response__empty-hint">
              Start the server, then use Send to preview the JSON response body here.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
