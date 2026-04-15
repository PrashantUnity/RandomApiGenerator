import type { KeyboardEvent } from 'react'
import { useCallback } from 'react'

export type UseTabListKeyboardParams = {
  tabCount: number
  selectedIndex: number
  onSelectIndex: (index: number) => void
  /** Same length as tab count; stable reference recommended. Used to move focus after keyboard selection. */
  tabIds?: readonly string[]
}

/** Next selected index for horizontal tablist keys, or `null` if the key does not navigate. */
export function tabListNextIndex(tabCount: number, selectedIndex: number, key: string): number | null {
  if (tabCount < 2) return null
  if (key === 'ArrowRight') return (selectedIndex + 1) % tabCount
  if (key === 'ArrowLeft') return (selectedIndex - 1 + tabCount) % tabCount
  if (key === 'Home') return 0
  if (key === 'End') return tabCount - 1
  return null
}

/**
 * Roving tabindex + ArrowLeft/ArrowRight/Home/End for horizontal `role="tablist"`.
 * Active tab has `tabIndex={0}`, others `-1`.
 */
export function useTabListKeyboard({
  tabCount,
  selectedIndex,
  onSelectIndex,
  tabIds,
}: UseTabListKeyboardParams) {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey || e.ctrlKey) return

      const key = e.key
      const next = tabListNextIndex(tabCount, selectedIndex, key)
      if (next === null) return

      e.preventDefault()
      if (next === selectedIndex) return

      onSelectIndex(next)
      const id = tabIds?.[next]
      if (id) {
        queueMicrotask(() => {
          document.getElementById(id)?.focus()
        })
      }
    },
    [tabCount, selectedIndex, onSelectIndex, tabIds],
  )

  const tabIndexFor = useCallback(
    (index: number) => (selectedIndex === index ? (0 as const) : (-1 as const)),
    [selectedIndex],
  )

  return { onKeyDown, tabIndexFor }
}
