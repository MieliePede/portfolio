import {useEffect, useState, type CSSProperties} from 'react'
import {useSearchParams} from 'react-router-dom'
import {Layout, LayoutContent, LayoutHeader} from '@astryxdesign/core/Layout'
import {HStack, StackItem, VStack} from '@astryxdesign/core/Stack'
import {Heading, Text} from '@astryxdesign/core/Text'
import {Card} from '@astryxdesign/core/Card'
import {Section} from '@astryxdesign/core/Section'
import {Grid} from '@astryxdesign/core/Grid'
import {Center} from '@astryxdesign/core/Center'
import {AspectRatio} from '@astryxdesign/core/AspectRatio'
import {TextInput} from '@astryxdesign/core/TextInput'
import {ToggleButton, ToggleButtonGroup} from '@astryxdesign/core/ToggleButton'
import {DropdownMenu} from '@astryxdesign/core/DropdownMenu'
import {Switch} from '@astryxdesign/core/Switch'
import {Spinner} from '@astryxdesign/core/Spinner'
import {Button} from '@astryxdesign/core/Button'
import {Link} from '@astryxdesign/core/Link'
import {Divider} from '@astryxdesign/core/Divider'
import {capitalise, DataCredits, getJson, lifespan, score, SIZES, type BreedSummary} from '../dogs'

// Fills the AspectRatio box; Astryx has no image primitive yet (same as its card-grid template).
const cover: CSSProperties = {width: '100%', height: '100%', objectFit: 'cover'}

const SORTS = {score: 'Health score', lifespan: 'Lifespan', name: 'Name'} as const
type Sort = keyof typeof SORTS

function BreedCard({b}: {b: BreedSummary}) {
  const img = b.image_url ?? b.photo
  return (
    <Card padding={0}>
      {img && (
        <AspectRatio ratio={4 / 3}>
          <img src={img} alt={b.name} style={cover} loading="lazy" />
        </AspectRatio>
      )}
      <Section variant="transparent" padding={4}>
        <VStack gap={1}>
          <Heading level={3}>
            <Link href={`/dogs/${b.slug}`}>{b.name}</Link>
          </Heading>
          <Text type="body" weight="bold">
            {score(b)}
          </Text>
          <Text type="supporting" color="secondary">
            {lifespan(b.median_lifespan_years)}
            {b.size ? ` · ${capitalise(b.size)}` : ''}
            {b.brachycephalic ? ' · Flat-faced' : ''}
          </Text>
          <Text type="body" size="sm" color="secondary">
            Prone to: {b.conditions.join(', ')}
          </Text>
        </VStack>
      </Section>
    </Card>
  )
}

export default function DogsPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const size = params.get('size')
  const flat = params.get('flat') === '1'
  const sort = (params.get('sort') ?? 'score') as Sort

  const [input, setInput] = useState(q)
  const [breeds, setBreeds] = useState<BreedSummary[] | null>(null)
  const [error, setError] = useState(false)

  const update = (key: string, value: string | null) =>
    setParams(
      p => {
        if (value) p.set(key, value)
        else p.delete(key)
        return p
      },
      {replace: true},
    )

  // debounce typing so each keystroke doesn't hit the API
  useEffect(() => {
    const t = setTimeout(() => input !== q && update('q', input.trim() || null), 250)
    return () => clearTimeout(t)
  }, [input]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ctrl = new AbortController()
    const search = new URLSearchParams({q, sort})
    if (size) search.set('size', size)
    if (flat) search.set('flat_faced', 'true')
    setError(false)
    getJson<{breeds: BreedSummary[]}>(`/api/breeds?${search}`, ctrl.signal)
      .then(d => setBreeds(d.breeds))
      .catch(e => e.name !== 'AbortError' && setError(true))
    return () => ctrl.abort()
  }, [q, size, flat, sort])

  return (
    <Layout
      height="auto"
      contentWidth={1200}
      header={
        <LayoutHeader hasDivider padding={6}>
          <VStack gap={2}>
            <HStack gap={2}>
              <Button label="← Portfolio" variant="ghost" size="sm" href="/" />
              <Button label="How this was built" variant="ghost" size="sm" href="/projects/dog-breed-health" />
            </HStack>
            <Heading level={1}>Dog breed health explorer</Heading>
            <Text type="body" color="secondary">
              Search 155 breeds by name or by condition, for example "hip dysplasia" or "heart", to see which breeds are prone to
              which health issues.
            </Text>
          </VStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent role="main" padding={6}>
          <VStack gap={6}>
            <VStack gap={4}>
              <TextInput
                label="Search breeds or conditions"
                isLabelHidden
                placeholder="Search a breed or a condition…"
                value={input}
                onChange={setInput}
                size="lg"
              />
              <HStack vAlign="center" gap={4} wrap="wrap">
                <StackItem size="fill">
                  <ToggleButtonGroup label="Filter by size" value={size ?? 'all'} onChange={v => update('size', v === 'all' || !v ? null : String(v))}>
                    <ToggleButton label="All sizes" value="all" />
                    {SIZES.map(s => (
                      <ToggleButton key={s} label={capitalise(s)} value={s} />
                    ))}
                  </ToggleButtonGroup>
                </StackItem>
                <Switch label="Flat-faced only" value={flat} onChange={on => update('flat', on ? '1' : null)} />
                <DropdownMenu
                  button={{label: `Sort: ${SORTS[sort] ?? SORTS.score}`}}
                  items={(Object.keys(SORTS) as Sort[]).map(k => ({label: SORTS[k], onClick: () => update('sort', k === 'score' ? null : k)}))}
                />
              </HStack>
            </VStack>

            {error ? (
              <Center>
                <Text type="body" color="secondary">
                  Breed data is unavailable right now. Please try again shortly.
                </Text>
              </Center>
            ) : breeds === null ? (
              <Center>
                <Spinner size="lg" />
              </Center>
            ) : breeds.length === 0 ? (
              <Center>
                <Text type="body" color="secondary">
                  No breeds match "{q}". Try a breed name or a condition such as "hip".
                </Text>
              </Center>
            ) : (
              <VStack gap={4}>
                <Text type="supporting" color="secondary">
                  {breeds.length} {breeds.length === 1 ? 'breed' : 'breeds'}
                </Text>
                <Grid columns={{minWidth: 280, max: 4}} gap={4}>
                  {breeds.map(b => (
                    <BreedCard key={b.slug} b={b} />
                  ))}
                </Grid>
              </VStack>
            )}

            <Divider />
            <DataCredits />
          </VStack>
        </LayoutContent>
      }
    />
  )
}
