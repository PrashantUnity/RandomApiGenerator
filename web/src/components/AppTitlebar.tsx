import type { EndpointConfig, MockCollection, MockWorkspace } from '../types'

export type AppTitlebarProps = {
  selectedWorkspace: MockWorkspace | undefined
  selectedCollection: MockCollection | undefined
  selected: EndpointConfig | undefined
}

export function AppTitlebar({
  selectedWorkspace,
  selectedCollection,
  selected,
}: AppTitlebarProps) {
  return (
    <header className="pm-titlebar">
      <div className="pm-titlebar__breadcrumb">
        <span className="pm-titlebar__workspace">Random API Generator · CodeFryDev</span>
        <span className="pm-titlebar__sep">/</span>
        <span className="pm-titlebar__req">
          {selectedWorkspace?.name ?? 'workspace'}
          <span className="pm-titlebar__sep"> / </span>
          {selectedCollection?.name ?? 'collection'}
          <span className="pm-titlebar__sep"> / </span>
          {selected?.path || 'route'}
        </span>
      </div>
    </header>
  )
}
