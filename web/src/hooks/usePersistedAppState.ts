import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { PersistedAppState } from '../types'
import { getElectronApi } from '../electronBridge'

type Args = {
  tree: PersistedAppState
  setTree: Dispatch<SetStateAction<PersistedAppState>>
}

export function usePersistedAppState({ tree, setTree }: Args) {
  const electron = typeof window !== 'undefined' ? getElectronApi() : undefined

  const [persistHydrated, setPersistHydrated] = useState(() => {
    if (typeof window === 'undefined') return true
    return !electron
  })
  const [persistDisabled, setPersistDisabled] = useState(false)
  const [persistBannerMessage, setPersistBannerMessage] = useState<string | null>(null)
  const [persistBannerDismissed, setPersistBannerDismissed] = useState(false)

  useEffect(() => {
    if (!electron) return
    void electron.loadAppState().then((r) => {
      if (r.ok) {
        if (r.warning) setPersistBannerMessage(r.warning)
        if (r.persistUnavailable) setPersistDisabled(true)
        if (r.data) setTree(r.data)
      } else {
        setPersistBannerMessage(r.error)
        setPersistDisabled(true)
      }
      setPersistHydrated(true)
    })
  }, [electron, setTree])

  useEffect(() => {
    if (!electron || !persistHydrated || persistDisabled) return
    const t = window.setTimeout(() => {
      void electron.saveAppState(tree)
    }, 400)
    return () => window.clearTimeout(t)
  }, [electron, persistHydrated, persistDisabled, tree])

  return {
    electron,
    persistHydrated,
    persistDisabled,
    persistBannerMessage,
    persistBannerDismissed,
    setPersistBannerDismissed,
  }
}
