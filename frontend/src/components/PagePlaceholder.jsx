export function PagePlaceholder({ title }) {
  return (
    <section className="page page--placeholder" aria-labelledby="placeholder-title">
      <p className="eyebrow">Protected area</p>
      <h1 id="placeholder-title">{title}</h1>
      <p>This section is ready for Task 12+ feature implementation.</p>
    </section>
  )
}
