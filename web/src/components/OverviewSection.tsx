export type OverviewSectionProps = {
  electron: unknown
  persistDisabled: boolean
}

export function OverviewSection({ electron, persistDisabled }: OverviewSectionProps) {
  return (
    <section className="pm-overview">
      <p>
        <strong>Sidebar:</strong> pick a <strong>workspace</strong> (saved group of routes), then open{' '}
        <strong>collection</strong> folders and select a <strong>request</strong> row. Method badges match
        the request bar. <strong>+ Collection</strong> adds a folder; <strong>+ Request</strong> adds a path
        under the open collection.
      </p>
      <p>
        Mock endpoints support <strong>GET</strong> and <strong>HEAD</strong> with a <code>count</code>{' '}
        query (1–500) for list responses; <strong>POST</strong> returns <code>201</code> with one generated
        object; <strong>PUT</strong>/<strong>PATCH</strong> return <code>200</code> with one object (optional
        JSON body is shallow-merged); <strong>DELETE</strong> returns <code>204</code>. On the{' '}
        <strong>Response</strong> tab, use a <strong>field list</strong> or an <strong>example response</strong>{' '}
        (JSON); start the server, choose a method, then <strong>Send</strong> to preview. Types such as{' '}
        <strong>lorem</strong>, <strong>picsum</strong> (Lorem Picsum image URLs), <strong>url</strong>, and{' '}
        <strong>slug</strong> produce placeholder text or links; loading <code>picsum</code> URLs in a browser
        requires network access to picsum.photos.
      </p>
      {Boolean(electron) && (
        <p className="pm-overview__persist">
          {persistDisabled ? (
            <>
              Local <strong>SQLite</strong> database is unavailable. Workspaces, routes, and settings are not
              saved between sessions.
            </>
          ) : (
            <>
              Workspaces, collections, selected route, HTTP method, and <code>count</code> are saved
              automatically in a local <strong>SQLite</strong> database and restored when you reopen the
              desktop app.
            </>
          )}
        </p>
      )}
    </section>
  )
}
