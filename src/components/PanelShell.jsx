export default function PanelShell({ eyebrow, title, description, children, accent = 'peach' }) {
  const accentClass = {
    peach: 'from-peach/30 to-transparent',
    sky: 'from-sky/35 to-transparent',
    moss: 'from-moss/20 to-transparent',
    coral: 'from-coral/25 to-transparent',
  }[accent];

  return (
    <section className="relative overflow-hidden rounded-[1.6rem] border border-ink/10 bg-white/80 p-4 shadow-float backdrop-blur sm:rounded-[2rem] sm:p-6">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${accentClass}`} />
      <div className="relative">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">
            {eyebrow}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl leading-tight text-ink sm:text-2xl">{title}</h2>
            {description ? (
              <p className="mt-2 max-w-xl text-sm leading-6 text-ink/65">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 sm:mt-5">{children}</div>
      </div>
    </section>
  );
}
