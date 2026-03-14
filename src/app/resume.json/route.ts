import { buildPublicResume } from '@/lib/publicResume'

export function GET() {
  return new Response(JSON.stringify(buildPublicResume(), null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}
