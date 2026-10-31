import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import type { MegaMenuConfig } from '../data/megaMenu'
import { images } from '../data/images'

type MegaMenuPanelProps = {
  config: MegaMenuConfig
  onClose: () => void
  onPointerEnter: () => void
  onPointerLeave: () => void
}

export function MegaMenuPanel({
  config,
  onClose,
  onPointerEnter,
  onPointerLeave,
}: MegaMenuPanelProps) {
  const featured = config.featured
  const featuredSrc = featured ? images[featured.imageKey] : undefined

  return (
    <motion.div
      id={`mega-menu-${config.id}`}
      role="region"
      aria-label={`${config.id} menu`}
      className="border-t border-revolut-line bg-white text-revolut-ink shadow-[0_24px_48px_rgba(25,28,31,0.12)]"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_240px] lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {config.columns.map((column) => (
            <div key={column.title}>
              <h3 className="type-label text-revolut-ink/50">{column.title}</h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      onClick={onClose}
                      className="text-sm text-revolut-ink/80 transition-colors hover:text-revolut-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {featured && featuredSrc && (
          <Link
            to={featured.to}
            onClick={onClose}
            className="group hidden overflow-hidden rounded-2xl bg-revolut-muted lg:block"
          >
            <img
              src={featuredSrc}
              alt=""
              className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="p-4">
              <p className="font-medium tracking-[-0.02em]">{featured.title}</p>
              <p className="mt-1 text-sm text-revolut-ink/65">{featured.description}</p>
            </div>
          </Link>
        )}
      </div>
    </motion.div>
  )
}
