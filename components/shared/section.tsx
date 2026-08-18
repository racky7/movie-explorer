export function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-medium">{title}</h2>
      {children}
    </section>
  )
}
