import {Fragment, type CSSProperties} from 'react'
import {Navigate, useParams} from 'react-router-dom'
import {Layout, LayoutContent, LayoutPanel} from '@astryxdesign/core/Layout'
import {HStack, VStack} from '@astryxdesign/core/Stack'
import {Heading, Text} from '@astryxdesign/core/Text'
import {Button} from '@astryxdesign/core/Button'
import {CodeBlock} from '@astryxdesign/core/CodeBlock'
import {Divider} from '@astryxdesign/core/Divider'
import {Outline} from '@astryxdesign/core/Outline'
import {useMediaQuery} from '@astryxdesign/core/hooks'
import {projects} from '../content'

// Same sticky rail as the Astryx documentation-technical template this page is built from.
const outlinePanel: CSSProperties = {position: 'sticky', top: 'var(--spacing-6)', alignSelf: 'start'}

export default function ProjectPage() {
  const {slug} = useParams()
  const isMobile = useMediaQuery('(max-width: 768px)', true)
  const project = projects.find(p => p.slug === slug && p.status === 'published')
  if (!project) return <Navigate to="/" replace />

  const outline = project.sections.map(s => ({id: s.id, label: s.heading, level: 2 as const}))

  return (
    <Layout
      height="auto"
      contentWidth={960}
      end={
        isMobile ? undefined : (
          <LayoutPanel isScrollable={false} label="On this page" role="complementary" style={outlinePanel}>
            <Outline items={outline} />
          </LayoutPanel>
        )
      }
      content={
        <LayoutContent role="main" isScrollable={false} padding={8}>
          <VStack gap={8}>
            <VStack gap={3}>
              <HStack gap={2}>
                <Button label="← Back to portfolio" variant="ghost" size="sm" href="/" />
                {project.repo && (
                  <Button label="View the code" variant="ghost" size="sm" href={project.repo} target="_blank" rel="noopener noreferrer" />
                )}
              </HStack>
              <Text as="h1" type="display-1">
                {project.title}
              </Text>
              <Text type="large" color="secondary">
                {project.summary}
              </Text>
              <Text type="supporting" color="secondary">
                {project.stack.join(' · ')}
              </Text>
              {isMobile && <Outline items={outline} />}
            </VStack>

            {project.sections.map((s, i) => (
              <Fragment key={s.id}>
                {i > 0 && <Divider />}
                <VStack gap={4}>
                  <Heading id={s.id} level={2}>
                    {s.heading}
                  </Heading>
                  {s.body.map(p => (
                    <Text key={p} type="body">
                      {p}
                    </Text>
                  ))}
                  {s.code && <CodeBlock code={s.code.code} language={s.code.language} width="100%" hasCopyButton />}
                </VStack>
              </Fragment>
            ))}
          </VStack>
        </LayoutContent>
      }
    />
  )
}
