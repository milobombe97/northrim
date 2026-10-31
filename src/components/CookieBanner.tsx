import { useEffect, useState } from 'react'
import { Button } from './Button'

const STORAGE_KEY = 'revolut-clone-cookies'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function dismiss(choice: string) {
    localStorage.setItem(STORAGE_KEY, choice)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] w-[min(100%,22rem)] rounded-2xl border border-revolut-line bg-white p-5 shadow-xl"
      role="dialog"
      aria-labelledby="cookie-title"
    >
      <h2 id="cookie-title" className="text-base font-semibold text-revolut-ink">
        Choose your cookies
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-revolut-ink/70">
        Cookies help us to enhance your experience, tailor ads to your interests, and improve our
        website.{' '}
        <button type="button" className="underline underline-offset-2">
          Learn more and manage
        </button>
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Button className="w-full" onClick={() => dismiss('all')}>
          Accept all
        </Button>
        <button
          type="button"
          onClick={() => dismiss('essential')}
          className="rounded-full py-2 text-sm font-medium text-revolut-ink/80 hover:text-revolut-ink"
        >
          Reject non-essential cookies
        </button>
      </div>
    </div>
  )
}
