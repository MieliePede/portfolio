import {useEffect, useMemo, useState, type CSSProperties} from 'react'
import {useNavigate} from 'react-router-dom'
import {Layout, LayoutContent} from '@astryxdesign/core/Layout'
import {HStack, VStack} from '@astryxdesign/core/Stack'
import {Heading, Text} from '@astryxdesign/core/Text'
import {Card} from '@astryxdesign/core/Card'
import {Button} from '@astryxdesign/core/Button'
import {Link} from '@astryxdesign/core/Link'
import {Center} from '@astryxdesign/core/Center'
import {Spinner} from '@astryxdesign/core/Spinner'
import {Divider} from '@astryxdesign/core/Divider'
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl'
import {Collapsible} from '@astryxdesign/core/Collapsible'
import {Table} from '@astryxdesign/core/Table'
import {useMediaQuery} from '@astryxdesign/core/hooks'
import {DataCredits, getJson, type BreedSummary} from '../dogs'
import {linearFit, lowerQuartile, pearson} from '../stats'

type Point = BreedSummary & {median_lifespan_years: number; severe_count: number; health_score: number}

function strength(r: number) {
  const a = Math.abs(r)
  return a >= 0.7 ? 'strong' : a >= 0.3 ? 'moderate' : 'weak'
}

// deterministic vertical spread within a row of the discrete severe-count axis, so dots don't stack
function jitter(slug: string) {
  let h = 0
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) | 0
  return ((Math.abs(h) % 1000) / 1000 - 0.5) * 0.6
}

// ─── Chart ────────────────────────────────────────────────────────────────────

type View = 'severe' | 'score'
// The SVG scales to its container, so text scales with it. Narrow screens get a narrower
// drawing (W) so 12px labels stay about 12px on screen instead of shrinking to ~7px.
const H = 400, M = {l: 52, r: 16, t: 16, b: 48}
const X0 = 5, X1 = 16
const AXES = {
  severe: {label: 'Severe conditions recorded', min: -0.5, max: 5.5, ticks: [0, 1, 2, 3, 4, 5]},
  score: {label: 'Health score', min: 0, max: 100, ticks: [0, 25, 50, 75, 100]},
} as const

// Theme tokens only: Astryx's data blue for the highlighted group, de-emphasised secondary text for context.
const HIGHLIGHT = 'var(--color-data-categorical-blue)'
const CONTEXT = 'color-mix(in srgb, var(--color-text-secondary) 45%, transparent)'
const RING = 'var(--color-background-card)'
const svgStyle: CSSProperties = {width: '100%', height: 'auto', display: 'block', overflow: 'visible'}
// the tooltip floats over the plot; Astryx has no positioning primitive for this (same reason as its templates' inline styles)
const chartFrame: CSSProperties = {position: 'relative'}

type Fit = {slope: number; intercept: number}

function Scatter({points, view, q1, isGap, fit}: {points: Point[]; view: View; q1: number; isGap: (p: Point) => boolean; fit: Fit}) {
  const navigate = useNavigate()
  const [hover, setHover] = useState<Point | null>(null)
  const W = useMediaQuery('(max-width: 768px)', true) ? 440 : 720
  const axis = AXES[view]
  const x = (v: number) => M.l + ((v - X0) / (X1 - X0)) * (W - M.l - M.r)
  const y = (v: number) => H - M.b - ((v - axis.min) / (axis.max - axis.min)) * (H - M.t - M.b)
  const yOf = (p: Point) => (view === 'severe' ? p.severe_count + jitter(p.slug) : p.health_score)
  const ordered = [...points].sort((a, b) => Number(isGap(a)) - Number(isGap(b))) // highlighted dots on top

  return (
    <VStack gap={0} style={chartFrame}>
      <svg viewBox={`0 0 ${W} ${H}`} style={svgStyle} role="img" aria-label={`Scatter plot of ${axis.label.toLowerCase()} against median lifespan for ${points.length} breeds`}>
        {/* gridlines and y ticks */}
        {axis.ticks.map(t => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeWidth={1} />
            <text x={M.l - 8} y={y(t)} dy="0.35em" textAnchor="end" fontSize={12} fill="var(--color-text-secondary)">
              {t}
            </text>
          </g>
        ))}
        {/* x axis */}
        <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} stroke="var(--color-border-emphasized)" strokeWidth={1} />
        {[6, 8, 10, 12, 14, 16].map(t => (
          <text key={t} x={x(t)} y={H - M.b + 18} textAnchor="middle" fontSize={12} fill="var(--color-text-secondary)">
            {t}
          </text>
        ))}
        <text x={(M.l + W - M.r) / 2} y={H - 6} textAnchor="middle" fontSize={12} fill="var(--color-text-secondary)">
          Median lifespan (years)
        </text>
        <text transform={`translate(14 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize={12} fill="var(--color-text-secondary)">
          {axis.label}
        </text>

        {/* the gap zone: shortest-lived quarter with no severe conditions */}
        {view === 'severe' && (
          <rect x={x(X0)} y={y(0.5)} width={x(q1) - x(X0)} height={y(-0.5) - y(0.5)} fill={HIGHLIGHT} opacity={0.1} rx={4} />
        )}
        <line x1={x(q1)} x2={x(q1)} y1={M.t} y2={H - M.b} stroke="var(--color-border-emphasized)" strokeWidth={1} />
        <text x={x(q1) - 6} y={M.t + 12} textAnchor="end" fontSize={12} fill="var(--color-text-secondary)">
          shortest-lived quarter
        </text>

        {/* trend line, clipped to the 0-100 score range; dots above it score better than their lifespan predicts */}
        {view === 'score' &&
          (() => {
            const at = (v: number) => fit.slope * v + fit.intercept
            const xa = Math.max(X0, (axis.min - fit.intercept) / fit.slope)
            const xb = Math.min(X1, (axis.max - fit.intercept) / fit.slope)
            // named in the legend; a label at the line's end would sit on the dense top-right cluster
            return <line x1={x(xa)} y1={y(at(xa))} x2={x(xb)} y2={y(at(xb))} stroke="var(--color-text-secondary)" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
          })()}

        {/* dots: 8px with a 2px surface ring, each with a 24px transparent hit area */}
        {ordered.map(p => {
          const cx = x(p.median_lifespan_years), cy = y(yOf(p))
          const on = hover?.slug === p.slug
          return (
            <g key={p.slug}>
              <circle cx={cx} cy={cy} r={on ? 6 : 4} fill={isGap(p) ? HIGHLIGHT : CONTEXT} stroke={RING} strokeWidth={2} />
              <circle
                cx={cx}
                cy={cy}
                r={12}
                fill="transparent"
                tabIndex={0}
                role="link"
                aria-label={`${p.name}: ${p.median_lifespan_years} years median lifespan, ${p.severe_count} severe conditions, health score ${p.health_score}`}
                style={{cursor: 'pointer', outline: 'none'}}
                onPointerEnter={() => setHover(p)}
                onPointerLeave={() => setHover(h => (h?.slug === p.slug ? null : h))}
                onFocus={() => setHover(p)}
                onBlur={() => setHover(null)}
                onClick={() => navigate(`/dogs/${p.slug}`)}
                onKeyDown={e => e.key === 'Enter' && navigate(`/dogs/${p.slug}`)}
              />
            </g>
          )
        })}
      </svg>

      {hover && (
        <Card
          padding={2}
          elevation="med"
          style={{
            position: 'absolute',
            left: `${(x(hover.median_lifespan_years) / W) * 100}%`,
            top: `${(y(yOf(hover)) / H) * 100}%`,
            transform: `translate(${hover.median_lifespan_years > 12 ? 'calc(-100% - 12px)' : '12px'}, -50%)`,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
          <VStack gap={0.5}>
            <Text type="body" weight="bold">
              {hover.median_lifespan_years} yrs · {hover.severe_count} severe · score {hover.health_score}
            </Text>
            <Text type="supporting" color="secondary">
              {hover.name}
            </Text>
          </VStack>
        </Card>
      )}
    </VStack>
  )
}

function LegendKey({color, label}: {color: string; label: string}) {
  return (
    <HStack gap={1} vAlign="center">
      <svg width={12} height={12} aria-hidden="true">
        <circle cx={6} cy={6} r={4} fill={color} />
      </svg>
      <Text type="supporting" color="secondary">
        {label}
      </Text>
    </HStack>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LifespanPage() {
  const [breeds, setBreeds] = useState<BreedSummary[] | null>(null)
  const [error, setError] = useState(false)
  const [view, setView] = useState<View>('score')

  useEffect(() => {
    const ctrl = new AbortController()
    getJson<{breeds: BreedSummary[]}>('/api/breeds?sort=name', ctrl.signal)
      .then(d => setBreeds(d.breeds))
      .catch(e => e.name !== 'AbortError' && setError(true))
    return () => ctrl.abort()
  }, [])

  const stats = useMemo(() => {
    if (!breeds) return null
    const points = breeds.filter(
      (b): b is Point => b.median_lifespan_years != null && b.severe_count != null && b.health_score != null,
    )
    const q1 = Math.round(lowerQuartile(points.map(p => p.median_lifespan_years)) * 10) / 10
    const isGap = (p: Point) => p.median_lifespan_years <= q1 && p.severe_count === 0
    const lifespans = points.map(p => p.median_lifespan_years)
    return {
      points,
      q1,
      isGap,
      gap: points.filter(isGap).sort((a, b) => a.median_lifespan_years - b.median_lifespan_years),
      r: {severe: pearson(lifespans, points.map(p => p.severe_count)), score: pearson(lifespans, points.map(p => p.health_score))},
      fit: linearFit(lifespans, points.map(p => p.health_score)),
    }
  }, [breeds])

  const r = stats ? stats.r[view] : 0

  return (
    <Layout
      height="auto"
      contentWidth={960}
      content={
        <LayoutContent role="main" isScrollable={false} padding={8}>
          <VStack gap={6}>
            <VStack gap={3}>
              <HStack gap={2} wrap="wrap">
                <Button label="← All breeds" variant="ghost" size="sm" href="/dogs" />
                <Button label="How this was built" variant="ghost" size="sm" href="/projects/dog-breed-health" />
              </HStack>
              <Text as="h1" type="display-2">
                Do healthier breeds live longer?
              </Text>
              <Text type="large" color="secondary">
                Each dot is a breed. Breeds that die young but have no serious conditions on record are either genuinely free of them, or
                not studied enough for them to show up yet.
              </Text>
            </VStack>

            {error ? (
              <Text type="body" color="secondary">
                Breed data is unavailable right now. Please try again shortly.
              </Text>
            ) : !stats ? (
              <Center minHeight="40vh">
                <Spinner size="lg" />
              </Center>
            ) : (
              <VStack gap={4}>
                <HStack gap={4} vAlign="center" wrap="wrap">
                  <SegmentedControl value={view} onChange={v => setView(v as View)} label="Compare lifespan with">
                    <SegmentedControlItem value="score" label="Health score" />
                    <SegmentedControlItem value="severe" label="Severe conditions" />
                  </SegmentedControl>
                  <Text type="body" weight="bold">
                    r = {r.toFixed(2)} ({strength(r)}) across {stats.points.length} breeds
                  </Text>
                </HStack>

                <Text type="body" color="secondary">
                  {view === 'severe'
                    ? `Longer-lived breeds tend to have fewer severe conditions on record, but the link is only ${strength(r)}: plenty of breeds break the pattern. Dots are spread slightly up and down within each row so they don't sit on top of each other.`
                    : `Health score climbs almost in step with lifespan. Part of that is by design: 65% of the score is lifespan (8 years scores 0, 15 years scores 100). The highlighted breeds sit above the trend line: for their short lives they score well, because none of their conditions on record is severe. Switch to severe conditions to see that part on its own.`}
                </Text>

                <Card padding={4}>
                  <VStack gap={3}>
                    <Scatter points={stats.points} view={view} q1={stats.q1} isGap={stats.isGap} fit={stats.fit} />
                    <HStack gap={4} wrap="wrap">
                      <LegendKey color={HIGHLIGHT} label={`Shortest-lived quarter (≤ ${stats.q1} yrs) with no severe conditions: ${stats.gap.length}`} />
                      <LegendKey color={CONTEXT} label={`Other breeds: ${stats.points.length - stats.gap.length}`} />
                      {view === 'score' && (
                        <HStack gap={1} vAlign="center">
                          <svg width={16} height={12} aria-hidden="true">
                            <line x1={2} y1={6} x2={14} y2={6} stroke="var(--color-text-secondary)" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
                          </svg>
                          <Text type="supporting" color="secondary">
                            Trend: typical score for a given lifespan
                          </Text>
                        </HStack>
                      )}
                    </HStack>
                  </VStack>
                </Card>

                <VStack gap={2}>
                  <Heading level={2}>The gap: short lives, no serious conditions on record</Heading>
                  <Text type="body">
                    These breeds are in the shortest-lived quarter, yet none of their listed conditions is classed as severe. The source notes
                    that its condition counts depend on how well a breed has been studied, so a short-lived breed with a clean record is a
                    candidate for missing data rather than proof of good health.
                  </Text>
                  <Table
                    data={stats.gap}
                    idKey="slug"
                    density="compact"
                    columns={[
                      {key: 'name', header: 'Breed', renderCell: (p: Point) => <Link href={`/dogs/${p.slug}`}>{p.name}</Link>},
                      {key: 'median_lifespan_years', header: 'Median lifespan (yrs)', align: 'end'},
                      {key: 'severe_count', header: 'Severe conditions', align: 'end'},
                      {key: 'health_score', header: 'Health score', align: 'end'},
                    ]}
                  />
                </VStack>

                <Collapsible
                  defaultIsOpen={false}
                  trigger={
                    <Text type="body" weight="bold">
                      Show all {stats.points.length} breeds as a table
                    </Text>
                  }>
                  <Table
                    data={[...stats.points].sort((a, b) => a.median_lifespan_years - b.median_lifespan_years)}
                    idKey="slug"
                    density="compact"
                    columns={[
                      {key: 'name', header: 'Breed', renderCell: (p: Point) => <Link href={`/dogs/${p.slug}`}>{p.name}</Link>},
                      {key: 'median_lifespan_years', header: 'Median lifespan (yrs)', align: 'end'},
                      {key: 'severe_count', header: 'Severe conditions', align: 'end'},
                      {key: 'health_score', header: 'Health score', align: 'end'},
                    ]}
                  />
                </Collapsible>
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
