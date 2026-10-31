import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export type FeatureSlide = {
  kicker: string
  title: string
  body: string
  href: string
  cta: string
  image: string
  alt: string
  focus?: string
}

export function HomeFeatureSlider({ slides }: { slides: FeatureSlide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || paused || count < 2) return
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count)
    }, 6500)
    return () => window.clearInterval(id)
  }, [paused, count])

  function go(next: number) {
    setIndex((next + count) % count)
  }

  return (
    <section
      className="bg-[#f7f4ef] py-16 lg:py-20"
      aria-roledescription="carousel"
      aria-label="Account services"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#8a7044]">Services</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-medium tracking-[-0.035em] sm:text-4xl">
              What the account covers
            </h2>
          </div>
          <p className="text-sm tabular-nums text-[#14181f]/55">
            {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </p>
        </div>

        <div className="relative h-[460px] overflow-hidden rounded-[2rem] bg-[#14181f] text-white sm:h-[520px]">
          {slides.map((slide, slideIndex) => {
            const active = slideIndex === index
            return (
              <div
                key={slide.title}
                className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                aria-hidden={!active}
              >
                <img
                  src={slide.image}
                  alt={active ? slide.alt : ''}
                  className={`absolute inset-0 h-full w-full object-cover ${slide.focus ?? 'object-center'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1210]/88 via-[#0c1210]/35 to-[#0c1210]/10" />
                <div className="relative flex h-full flex-col justify-end p-7 sm:p-10">
                  <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#e6c98a]">{slide.kicker}</p>
                  <h3 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.05] tracking-[-0.035em] sm:text-5xl">
                    {slide.title}
                  </h3>
                  <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">{slide.body}</p>
                  {active && (
                    <Link
                      to={slide.href}
                      className="mt-6 inline-flex w-fit rounded-full bg-white px-6 py-3 text-sm font-medium text-[#14181f]"
                    >
                      {slide.cta}
                    </Link>
                  )}
                </div>
              </div>
            )
          })}

          <div className="absolute bottom-7 right-7 z-10 flex items-center gap-2 sm:bottom-10 sm:right-10">
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full border border-white/30 bg-[#0c1210]/40 text-lg backdrop-blur-sm"
              aria-label="Previous service"
              onClick={() => go(index - 1)}
            >
              ←
            </button>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full border border-white/30 bg-[#0c1210]/40 text-lg backdrop-blur-sm"
              aria-label="Next service"
              onClick={() => go(index + 1)}
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-5 flex gap-2" role="tablist" aria-label="Choose a service">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.title}
              type="button"
              role="tab"
              aria-selected={slideIndex === index}
              aria-label={slide.title}
              className={`h-1 rounded-full transition-all ${slideIndex === index ? 'w-10 bg-[#14181f]' : 'w-4 bg-[#14181f]/25'}`}
              onClick={() => go(slideIndex)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
