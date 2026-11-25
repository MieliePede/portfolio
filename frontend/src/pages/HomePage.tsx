import type {CSSProperties} from 'react'
import {Layout, LayoutContent, LayoutPanel} from '@astryxdesign/core/Layout'
import {HStack, VStack} from '@astryxdesign/core/Stack'
import {Heading, Text} from '@astryxdesign/core/Text'
import {Card} from '@astryxdesign/core/Card'
import {Button} from '@astryxdesign/core/Button'
import {Link} from '@astryxdesign/core/Link'
import {Divider} from '@astryxdesign/core/Divider'
import {List, ListItem} from '@astryxdesign/core/List'
import {useMediaQuery} from '@astryxdesign/core/hooks'
import {credentials, experience, profile, projects, skills} from '../content'

// Layout primitives have no sticky prop yet (same workaround as the Astryx course-detail template).
const stickyRail: CSSProperties = {position: 'sticky', top: 'var(--spacing-8)', alignSelf: 'start'}

function ProfileCard() {
  return (
    <Card padding={5}>
      <VStack gap={4}>
        <VStack gap={1}>
          <Text as="h1" type="display-3">
            {profile.name}
          </Text>
          <Text type="large">{profile.title}</Text>
          <Text type="supporting" color="secondary">
            {profile.location}
          </Text>
        </VStack>
        <VStack gap={2}>
          <Button label="Download CV" variant="primary" href={profile.cv} target="_blank" rel="noopener" />
          <Button label="Email me" href={`mailto:${profile.email}`} />
          <HStack gap={2}>
            <Button label="LinkedIn" variant="ghost" href={profile.linkedin} target="_blank" rel="noopener noreferrer" />
            <Button label="GitHub" variant="ghost" href={profile.github} target="_blank" rel="noopener noreferrer" />
          </HStack>
        </VStack>
        <Divider />
        <VStack gap={2}>
          <Text type="label">Certification & education</Text>
          {credentials.map(c => (
            <VStack key={c.label} gap={0.5}>
              <Text type="body">{c.label}</Text>
              <Text type="supporting" color="secondary">
                {c.detail}
              </Text>
            </VStack>
          ))}
        </VStack>
      </VStack>
    </Card>
  )
}

function Section({id, title, children}: {id: string; title: string; children: React.ReactNode}) {
  return (
    <VStack gap={4}>
      <Heading id={id} level={2}>
        {title}
      </Heading>
      {children}
    </VStack>
  )
}

export default function HomePage() {
  const isMobile = useMediaQuery('(max-width: 768px)', true)

  return (
    <Layout
      height="auto"
      contentWidth={1100}
      start={
        isMobile ? undefined : (
          <LayoutPanel isScrollable={false} label="Profile" role="complementary" style={stickyRail}>
            <ProfileCard />
          </LayoutPanel>
        )
      }
      content={
        <LayoutContent role="main" isScrollable={false} padding={8}>
          <VStack gap={8}>
            {isMobile && <ProfileCard />}

            <Section id="about" title="About">
              <Text type="body">{profile.summary}</Text>
              <Text type="body" color="secondary">
                {profile.lookingFor}
              </Text>
            </Section>

            <Divider />

            <Section id="experience" title="Experience">
              <VStack gap={6}>
                {experience.map(role => (
                  <VStack key={role.title + role.period} gap={2}>
                    <VStack gap={0.5}>
                      <Text type="large" weight="bold">
                        {role.title}
                      </Text>
                      <Text type="supporting" color="secondary">
                        {role.company} · {role.period}
                      </Text>
                    </VStack>
                    {role.highlights.length > 0 && (
                      <List density="compact" listStyle="disc">
                        {role.highlights.map(h => (
                          <ListItem key={h} label={<>{h}</>} />
                        ))}
                      </List>
                    )}
                  </VStack>
                ))}
              </VStack>
            </Section>

            <Divider />

            <Section id="projects" title="Projects & case studies">
              <VStack gap={4}>
                {projects.map(p => (
                  <Card key={p.slug} padding={5} variant={p.status === 'planned' ? 'muted' : 'default'}>
                    <VStack gap={2}>
                      <Text type="large" weight="bold">
                        {p.title}
                      </Text>
                      <Text type="body" color="secondary">
                        {p.summary}
                      </Text>
                      {p.stack.length > 0 && (
                        <Text type="supporting" color="secondary">
                          {p.stack.join(' · ')}
                        </Text>
                      )}
                      {p.status === 'published' && (
                        <HStack gap={4} wrap="wrap">
                          <Link href={`/projects/${p.slug}`}>Read the case study</Link>
                          {p.demo && <Link href={p.demo}>Open the live demo</Link>}
                        </HStack>
                      )}
                    </VStack>
                  </Card>
                ))}
              </VStack>
            </Section>

            <Divider />

            <Section id="skills" title="Skills">
              <List density="compact">
                {skills.map(s => (
                  <ListItem
                    key={s.group}
                    label={s.group}
                    description={<Text type="supporting" color="secondary">{s.items.join(', ')}</Text>}
                  />
                ))}
              </List>
            </Section>
          </VStack>
        </LayoutContent>
      }
    />
  )
}
