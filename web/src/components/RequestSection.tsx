import { HTTP_METHODS, type HttpMethod } from '../types'

export type RequestSectionProps = {
  running: boolean
  electron: unknown
  requestMethod: HttpMethod
  displayUrl: string
  placeholderUrl: string
  sampleCount: string
  showCountQuery: boolean
  showRequestBodyEditor: boolean
  requestBody: string
  onRequestMethodChange: (m: HttpMethod) => void
  onSampleCountChange: (v: string) => void
  onRequestBodyChange: (v: string) => void
  onSend: () => void
}

export function RequestSection({
  running,
  electron,
  requestMethod,
  displayUrl,
  placeholderUrl,
  sampleCount,
  showCountQuery,
  showRequestBodyEditor,
  requestBody,
  onRequestMethodChange,
  onSampleCountChange,
  onRequestBodyChange,
  onSend,
}: RequestSectionProps) {
  return (
    <section className="pm-request" aria-label="Request">
      <div className="pm-request__row">
        <label className="pm-request__method" title="HTTP method">
          <span className="pm-sr-only">HTTP method</span>
          <select
            className="pm-request__method-select"
            value={requestMethod}
            onChange={(e) => onRequestMethodChange(e.target.value as HttpMethod)}
            disabled={!running}
            aria-label="HTTP method"
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <div className="pm-request__url-wrap">
          <input
            className="pm-request__url"
            readOnly
            value={displayUrl || placeholderUrl}
            placeholder="Start the server to build the request URL"
          />
        </div>
        <button
          type="button"
          className="pm-btn pm-btn--send"
          disabled={!running || !electron}
          onClick={() => void onSend()}
          aria-label={`Send HTTP ${requestMethod} request`}
        >
          Send
        </button>
      </div>
      {showCountQuery && (
        <div className="pm-request__meta">
          <label className="pm-query">
            <span className="pm-query__key">count</span>
            <input
              className="pm-query__val"
              value={sampleCount}
              onChange={(e) => onSampleCountChange(e.target.value)}
              inputMode="numeric"
              disabled={!running}
              aria-label="Number of sample records (count query parameter)"
            />
          </label>
        </div>
      )}
      {showRequestBodyEditor && (
        <div className="pm-request__body">
          <label className="pm-request__body-label" htmlFor="pm-request-body">
            Body (JSON)
          </label>
          <textarea
            id="pm-request-body"
            className="pm-request__body-input"
            value={requestBody}
            onChange={(e) => onRequestBodyChange(e.target.value)}
            placeholder="Optional JSON object to merge with the mock response"
            disabled={!running}
            spellCheck={false}
            aria-label="Request body JSON"
          />
        </div>
      )}
    </section>
  )
}
