import { Card, CardBody } from "@/components/ui/card"

export default function AppLoading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-800/60" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-800/40" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardBody>
              <div className="mb-3 h-10 w-10 animate-pulse rounded-xl bg-slate-800/60" />
              <div className="h-6 w-24 animate-pulse rounded bg-slate-800/60" />
              <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-800/40" />
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardBody>
              <div className="mb-4 h-4 w-40 animate-pulse rounded bg-slate-800/60" />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="mb-2.5 h-[58px] animate-pulse rounded-xl border border-[#16213a] bg-[#0d1526]" />
              ))}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
