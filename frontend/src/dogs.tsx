// Shared by the dog breed pages: API types, fetch helper, and the credits the data licences require.
import {VStack} from '@astryxdesign/core/Stack'
import {Text} from '@astryxdesign/core/Text'
import {Link} from '@astryxdesign/core/Link'

export type BreedSummary = {
  slug: string
  name: string
  size: string | null
  median_lifespan_years: number | null
  brachycephalic: boolean
  health_score: number | null
  grade: string | null
  longevity: number | null
  conformation: number | null
  burden: number | null
  severe_count: number | null
  conditions: string[]
  image_url: string | null
  photo: string | null
}

export type Breed = BreedSummary & {
  weight: string | null
  source_url: string
  image_credit: string | null
  photos: string[]
  synced_at: string
}

export const SIZES = ['toy', 'small', 'medium', 'large', 'giant'] as const

export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(url, {signal})
  if (!r.ok) throw new Error(r.status === 404 ? 'not-found' : `HTTP ${r.status}`)
  return r.json()
}

export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function score(b: Pick<BreedSummary, 'grade' | 'health_score'>) {
  return b.health_score == null ? 'Not scored' : `Grade ${b.grade ?? '?'} · ${b.health_score}/100`
}

export function lifespan(years: number | null) {
  return years == null ? 'Lifespan unknown' : `${years.toFixed(1)} yrs median lifespan`
}

/** Disclaimer plus the credits the sources require (Breed Health Score is CC-BY-4.0: visible link). */
export function DataCredits() {
  return (
    <VStack gap={1}>
      <Text type="supporting" color="secondary">
        Independent estimates, not veterinary advice. Speak to a vet about your own dog.
      </Text>
      <Text type="supporting" color="secondary">
        Health scores and conditions:{' '}
        <Link href="https://breedhealthscore.com" isExternalLink type="supporting">
          Breed Health Score
        </Link>{' '}
        (CC-BY-4.0). Lifespan data: McMillan et al. (2024), "Longevity of companion dog breeds", Scientific Reports.
        Extra photos:{' '}
        <Link href="https://dog.ceo/dog-api/" isExternalLink type="supporting">
          Dog CEO
        </Link>{' '}
        (Stanford Dogs Dataset).
      </Text>
    </VStack>
  )
}
