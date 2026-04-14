import type {
  EndpointConfig,
  EndpointResponseMode,
  PersistedAppState,
  SchemaField,
  SchemaFieldType,
} from '../types'
import { FIELD_TYPES } from '../constants'

export type ResponseDefinitionSectionProps = {
  tree: PersistedAppState
  selected: EndpointConfig
  running: boolean
  flatEndpoints: EndpointConfig[]
  responseMode: EndpointResponseMode
  exampleResponseError: string | null
  onUpdatePath: (path: string) => void
  onRemoveRoute: () => void
  onSetResponseMode: (mode: EndpointResponseMode) => void
  onUpdateSampleJson: (text: string) => void
  onUpdateField: (fieldIndex: number, patch: Partial<SchemaField>) => void
  onRemoveField: (fieldIndex: number) => void
  onAddField: () => void
}

export function ResponseDefinitionSection({
  tree,
  selected,
  running,
  flatEndpoints,
  responseMode,
  exampleResponseError,
  onUpdatePath,
  onRemoveRoute,
  onSetResponseMode,
  onUpdateSampleJson,
  onUpdateField,
  onRemoveField,
  onAddField,
}: ResponseDefinitionSectionProps) {
  return (
    <section className="pm-schema" aria-label="Response definition">
      <div className="pm-schema__head">
        <span className="pm-schema__path-label">Path segment</span>
        <div className="pm-schema__path-row">
          <span className="pm-schema__slash">/</span>
          <input
            className="pm-input pm-input--path"
            value={selected.path}
            onChange={(e) => onUpdatePath(e.target.value)}
            placeholder="users"
            disabled={running}
          />
          {flatEndpoints.length > 1 && (
            <button
              type="button"
              className="pm-btn pm-btn--danger-ghost"
              disabled={running}
              onClick={() => onRemoveRoute()}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="pm-schema__mode">
        <span className="pm-schema__path-label">How to define the response</span>
        <div className="pm-schema__mode-row" role="group" aria-label="Response definition mode">
          <button
            type="button"
            className={`pm-mode-btn ${responseMode === 'schema' ? 'pm-mode-btn--active' : ''}`}
            disabled={running}
            onClick={() => onSetResponseMode('schema')}
          >
            Field list
          </button>
          <button
            type="button"
            className={`pm-mode-btn ${responseMode === 'sampleJson' ? 'pm-mode-btn--active' : ''}`}
            disabled={running}
            onClick={() => onSetResponseMode('sampleJson')}
          >
            Example response
          </button>
        </div>
        <p className="pm-schema__mode-hint">
          {responseMode === 'schema'
            ? 'The field list and example response stay in sync for flat objects (primitive values only). Nested objects or arrays in JSON do not update the table.'
            : 'Flat objects sync to the field list automatically. Nested shapes only apply in this editor — they do not update the table.'}
        </p>
      </div>

      {responseMode === 'sampleJson' && (
        <div className="pm-example-response">
          <label
            className="pm-example-response__label"
            htmlFor={`example-response-${tree.selectedCollectionId}-${tree.selectedRouteIndex}`}
          >
            Example response body (JSON)
          </label>
          <textarea
            id={`example-response-${tree.selectedCollectionId}-${tree.selectedRouteIndex}`}
            className={`pm-textarea ${exampleResponseError ? 'pm-textarea--err' : ''}`}
            value={selected.sampleJson ?? ''}
            onChange={(e) => onUpdateSampleJson(e.target.value)}
            disabled={running}
            spellCheck={false}
            aria-invalid={Boolean(exampleResponseError)}
            aria-describedby={exampleResponseError ? 'example-response-error' : undefined}
            rows={14}
          />
          {exampleResponseError && (
            <p id="example-response-error" className="pm-example-response__error" role="alert">
              {exampleResponseError}
            </p>
          )}
        </div>
      )}

      {responseMode === 'schema' && (
        <>
          <table className="pm-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Type</th>
                <th className="pm-table__narrow" />
              </tr>
            </thead>
            <tbody>
              {selected.schema.map((field, fi) => (
                <tr key={`${field.name}-${fi}`}>
                  <td>
                    <input
                      className="pm-input"
                      value={field.name}
                      onChange={(e) => onUpdateField(fi, { name: e.target.value })}
                      disabled={running}
                    />
                  </td>
                  <td>
                    <select
                      className="pm-select"
                      value={field.type}
                      onChange={(e) =>
                        onUpdateField(fi, {
                          type: e.target.value as SchemaFieldType,
                        })
                      }
                      disabled={running}
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="pm-icon-btn"
                      title="Remove field"
                      disabled={running || selected.schema.length <= 1}
                      onClick={() => onRemoveField(fi)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="pm-link" disabled={running} onClick={() => onAddField()}>
            + Add field
          </button>
        </>
      )}
    </section>
  )
}
