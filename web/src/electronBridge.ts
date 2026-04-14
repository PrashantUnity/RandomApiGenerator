/** True only when preload exposed the full IPC bridge (avoids partial/stub `window.electronAPI`). */
export function isElectronBridge(
  api: Window['electronAPI'] | undefined,
): api is NonNullable<Window['electronAPI']> {
  return (
    !!api &&
    typeof api.loadAppState === 'function' &&
    typeof api.saveAppState === 'function' &&
    typeof api.startServer === 'function' &&
    typeof api.stopServer === 'function' &&
    typeof api.onServerStatus === 'function'
  )
}

export function getElectronApi(): NonNullable<Window['electronAPI']> | undefined {
  if (typeof window === 'undefined') return undefined
  return isElectronBridge(window.electronAPI) ? window.electronAPI : undefined
}
