import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>This module is being built in {phase}.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
