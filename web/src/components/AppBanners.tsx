export type AppBannersProps = {
  electron: unknown
  persistBannerMessage: string | null
  persistBannerDismissed: boolean
  onDismissPersistBanner: () => void
}

export function AppBanners({
  electron,
  persistBannerMessage,
  persistBannerDismissed,
  onDismissPersistBanner,
}: AppBannersProps) {
  return (
    <>
      {!electron && (
        <div className="pm-banner" role="status">
          Electron API unavailable. Use <code>npm run dev</code> for the full desktop app.
        </div>
      )}

      {electron && persistBannerMessage && !persistBannerDismissed && (
        <div className="pm-banner pm-banner--persist" role="status">
          <div className="pm-banner__row">
            <span>{persistBannerMessage}</span>
            <button
              type="button"
              className="pm-banner__dismiss"
              onClick={onDismissPersistBanner}
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  )
}
