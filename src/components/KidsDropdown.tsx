import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { kidsMenuItems } from '../data/megaMenu'
import { images } from '../data/images'

type KidsDropdownProps = {
  open: boolean
  onClose: () => void
}

export function KidsDropdown({ open, onClose }: KidsDropdownProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="menu"
          aria-label="Kids and Teens"
          className="absolute left-1/2 top-full z-50 mt-3 w-[min(100vw-2rem,22rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-revolut-line bg-white p-2 text-revolut-ink shadow-xl"
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={images.menuKids}
            alt=""
            className="mb-2 h-28 w-full rounded-xl object-cover"
          />
          <ul>
            {kidsMenuItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  role="menuitem"
                  onClick={onClose}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-revolut-ink/85 transition-colors hover:bg-revolut-muted hover:text-revolut-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
