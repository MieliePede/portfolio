import {useEffect, useState, type CSSProperties} from 'react'
import {Navigate, useParams} from 'react-router-dom'
import {Layout, LayoutContent} from '@astryxdesign/core/Layout'
import {HStack, VStack} from '@astryxdesign/core/Stack'
import {Heading, Text} from '@astryxdesign/core/Text'
import {Grid} from '@astryxdesign/core/Grid'
import {Center} from '@astryxdesign/core/Center'
import {AspectRatio} from '@astryxdesign/core/AspectRatio'
import {SelectableCard} from '@astryxdesign/core/SelectableCard'
import {Button} from '@astryxdesign/core/Button'
import {ProgressBar} from '@astryxdesign/core/ProgressBar'
import {List, ListItem} from '@astryxdesign/core/List'
import {Divider} from '@astryxdesign/core/Divider'
import {Spinner} from '@astryxdesign/core/Spinner'
import {capitalise, DataCredits, getJson, lifespan, score, type Breed} from '../dogs'

// Same workarounds as the Astryx product-detail template this page is built from:
// no sticky prop on layout primitives (#2613), no image primitive (#2582).
const stickyInfo: CSSProperties = {position: 'sticky', top: 'var(--spacing-8)', alignSelf: 'start'}
const heroImage: CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-container)'}
const thumbImage: CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', display: 'block'}

const COMPONENTS = [
  {key: 'longevity', label: 'Longevity', hint: 'how the median lifespan compares with other breeds'},
  {key: 'conformation', label: 'Conformation', hint: 'body-shape risks such as a flat face'},
  {key: 'burden', label: 'Condition burden', hint: 'how heavy its known conditions are'},
] as const

function Gallery({breed}: {breed: Breed}) {
  const images = [breed.image_url, ...breed.photos].filter((u): u is string => !!u)
  const [selected, setSelected] = useState(0)
  if (images.length === 0) return null
  const credit = selected === 0 && breed.image_url ? breed.image_credit : 'Dog CEO / Stanford Dogs Dataset'
  return (
    <VStack gap={3}>
      <AspectRatio ratio={4 / 3}>
        <img style={heroImage} src={images[selected]} alt={breed.name} />
      </AspectRatio>
      {credit && (
        <Text type="supporting" color="secondary">
          Photo: {credit}
        </Text>
      )}
      {images.length > 1 && (
        <Grid columns={4} gap={2}>
          {images.map((src, i) => (
            <AspectRatio key={src} ratio={1}>
              <SelectableCard
                label={`${breed.name} photo ${i + 1}`}
                isSelected={selected === i}
                onChange={() => setSelected(i)}
                variant="transparent"
                padding={0}
                width="100%"
                height="100%">
                <img style={thumbImage} src={src} alt={`${breed.name} photo ${i + 1}`} loading="lazy" />
              </SelectableCard>
            </AspectRatio>
          ))}
        </Grid>
      )}
    </VStack>
  )
}

function Info({breed}: {breed: Breed}) {
  const facts = [
    lifespan(breed.median_lifespan_years),
    breed.size && `Size: ${capitalise(breed.size)}`,
    breed.weight && `Weight: ${breed.weight}`,
    breed.brachycephalic ? 'Flat-faced (brachycephalic)' : 'Not flat-faced',
    breed.severe_count != null && `${breed.severe_count} of its conditions classed as severe`,
  ].filter(Boolean) as string[]

  return (
    <VStack gap={5}>
      <VStack gap={2}>
        <Text type="display-2" as="h1">
          {breed.name}
        </Text>
        <Text type="large" weight="bold">
          {score(breed)}
        </Text>
      </VStack>

      <VStack gap={3}>
        {COMPONENTS.map(c =>
          breed[c.key] == null ? null : (
            <VStack key={c.key} gap={1}>
              <ProgressBar label={c.label} value={breed[c.key] as number} hasValueLabel formatValueLabel={v => `${v}/100`} />
              <Text type="supporting" color="secondary">
                {c.hint}
              </Text>
            </VStack>
          ),
        )}
      </VStack>

      <List density="compact" listStyle="disc">
        {facts.map(f => (
          <ListItem key={f} label={<>{f}</>} />
        ))}
      </List>

      <Divider />

      <VStack gap={2}>
        <Heading level={2}>Conditions this breed is prone to</Heading>
        <List density="compact" listStyle="disc">
          {breed.conditions.map(c => (
            <ListItem key={c} label={<>{c}</>} />
          ))}
        </List>
      </VStack>

      <HStack gap={2} wrap="wrap">
        <Button label="View on Breed Health Score" variant="primary" href={breed.source_url} target="_blank" rel="noopener noreferrer" />
        <Button label="← All breeds" href="/dogs" />
      </HStack>
    </VStack>
  )
}

export default function DogBreedPage() {
  const {slug = ''} = useParams()
  const [breed, setBreed] = useState<Breed | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading')

  useEffect(() => {
    const ctrl = new AbortController()
    setState('loading')
    getJson<Breed>(`/api/breeds/${encodeURIComponent(slug)}`, ctrl.signal)
      .then(b => {
        setBreed(b)
        setState('ok')
      })
      .catch(e => e.name !== 'AbortError' && setState(e.message === 'not-found' ? 'missing' : 'error'))
    return () => ctrl.abort()
  }, [slug])

  if (state === 'missing') return <Navigate to="/dogs" replace />

  return (
    <Layout
      height="auto"
      contentWidth={1200}
      content={
        <LayoutContent role="main" padding={6}>
          <VStack gap={6}>
            {state === 'ok' && breed ? (
              <Grid columns={{minWidth: 320, max: 2, repeat: 'fit'}} gap={6}>
                <Gallery key={breed.slug} breed={breed} />
                <VStack gap={0} style={stickyInfo}>
                  <Info breed={breed} />
                </VStack>
              </Grid>
            ) : (
              <Center>
                {state === 'error' ? (
                  <Text type="body" color="secondary">
                    Breed data is unavailable right now. Please try again shortly.
                  </Text>
                ) : (
                  <Spinner size="lg" />
                )}
              </Center>
            )}
            <Divider />
            <DataCredits />
          </VStack>
        </LayoutContent>
      }
    />
  )
}
