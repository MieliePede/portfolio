// All site copy lives here, so updating a role or a case study never touches layout code.

export const profile = {
  name: 'Emile Nikel',
  title: 'Senior Software Engineer',
  location: 'Hillcrest, KwaZulu-Natal, South Africa',
  summary:
    'I build and run business software, from banking platforms at FNB to lease accounting systems, and I have spent the last few years moving between hands-on development and team leadership. Recently that has meant taking AI-driven prototypes to production, cutting cloud costs, and setting up CI/CD and AI-development practices for a team.',
  lookingFor:
    'Looking for software engineering roles, and open to AI Developer, Technical Lead or Founding Engineer positions.',
  email: 'nikel.emile@gmail.com',
  linkedin: 'https://linkedin.com/in/emile-nikel',
  github: 'https://github.com/MieliePede',
  cv: '/cv.pdf',
}

export type Role = {
  title: string
  company: string
  period: string
  highlights: string[]
}

export const experience: Role[] = [
  {
    title: 'Senior Software Developer',
    company: 'C2 Investment Technologies Group',
    period: 'Mar 2025 – Sep 2026',
    highlights: [
      'Led the migration of LeaseTracker, a three-app lease accounting platform sharing four databases across environments, from a third-party host to in-house management.',
      'Cut AWS hosting costs by about $600 a month across four applications, each with two environments, through monthly cost analysis.',
      'Acted as Team Lead and Scrum Master for the accounting software team alongside development, and liaised directly with stakeholders when there was no Product Owner.',
      'Supported about 16 concurrent AI-driven prototypes with a tier-based pricing model and profit-and-loss estimates, and introduced the process for taking projects from idea to production.',
      'Built AI-assisted automations for mid-sized businesses, including client-facing job summaries generated from SimPro webhooks and an AI-categorised pricing tool for an Australian trades business.',
      'Set up a framework for AI-driven development: tool due diligence, team guardrails, and a stack-agnostic CI/CD pipeline with quality gates in GitHub Actions.',
    ],
  },
  {
    title: 'Intermediate Java Software Engineer',
    company: 'FNB South Africa',
    period: 'Feb 2022 – Mar 2025',
    highlights: [
      "Developed full-stack Java applications for FNB's internal banking platforms, including the Telling Solution used by branch staff, in a secure, regulated environment.",
      "Shipped monthly releases with Java, Spring Boot and the bank's in-house frontend framework against a 99.99% uptime target.",
    ],
  },
  {
    title: 'Junior Java Software Engineer',
    company: 'FNB South Africa',
    period: 'Jun 2020 – Feb 2022',
    highlights: [
      'Maintained the HR platform used by several thousand FNB employees, built with Java and Spring Boot, with monthly releases against a 99.99% uptime target.',
    ],
  },
  {
    title: 'Software Engineer Intern',
    company: 'FNB South Africa · BCX',
    period: '2019 – 2020',
    highlights: [],
  },
]

export const skills: {group: string; items: string[]}[] = [
  {group: 'Languages & frameworks', items: ['Java', 'Python', 'Spring Boot', 'React', 'TypeScript', 'JavaScript', 'SQL', 'PHP', 'PrimeFaces']},
  {group: 'Databases', items: ['PostgreSQL', 'MySQL', 'SQLite']},
  {group: 'Cloud & DevOps', items: ['AWS', 'GCP', 'Docker', 'GitHub Actions', 'CI/CD pipeline design', 'Render']},
  {group: 'AI & automation', items: ['OpenAI API', 'LLMs', 'Prompt engineering', 'AI agent integration', 'n8n', 'Workflow automation']},
  {group: 'Integration', items: ['REST APIs', 'Webhooks', 'SimPro API', 'Legacy database integration']},
  {group: 'Delivery & leadership', items: ['Scrum', 'Team lead', 'Stakeholder management', 'Requirements gathering', 'Project profitability analysis']},
]

export const credentials = [
  {label: 'Professional Scrum Master I (PSM I)', detail: 'Scrum.org'},
  {label: 'Software Engineering programme', detail: 'WeThinkCode, completed 2020'},
]

export type CaseStudySection = {
  id: string
  heading: string
  body: string[]
  code?: {language: string; code: string}
}

export type Project = {
  slug: string
  title: string
  summary: string
  stack: string[]
  repo?: string
  demo?: string
  // planned projects show on the home page as "coming soon" and have no page yet
  status: 'published' | 'planned'
  sections: CaseStudySection[]
}

export const projects: Project[] = [
  {
    slug: 'portfolio-platform',
    title: 'This site: CI/CD and a hardened single-server deploy',
    summary:
      'How this portfolio ships: every merge to master builds and deploys itself to one locked-down Ubuntu server, with no secrets on disk and no shell access for the deploy key.',
    stack: ['React', 'FastAPI', 'PostgreSQL', 'Docker Compose', 'Caddy', 'GitHub Actions'],
    repo: 'https://github.com/MieliePede/portfolio',
    status: 'published',
    sections: [
      {
        id: 'overview',
        heading: 'Overview',
        body: [
          'The site is a React frontend and a FastAPI backend with PostgreSQL behind them, all running as one Docker Compose stack on a single Ubuntu server. Caddy sits in front, terminates HTTPS and renews certificates on its own, so the server needs nothing installed apart from Docker.',
          'Only Caddy is reachable from the internet. The frontend, backend and database talk over a private Docker network.',
        ],
      },
      {
        id: 'pipeline',
        heading: 'The deploy pipeline',
        body: [
          'A merge to master triggers a GitHub Actions workflow that connects to the server over SSH and runs one script. The script pulls the new code, rebuilds the images against freshly pulled base images so security patches land on every deploy, and restarts only what changed.',
        ],
        code: {
          language: 'bash',
          code: `git pull --ff-only
docker compose build --pull
docker compose up -d --pull always --remove-orphans
docker image prune -f`,
        },
      },
      {
        id: 'secrets',
        heading: 'Keeping secrets off the server',
        body: [
          'The database password lives only in GitHub Actions secrets. The workflow pipes it over the SSH connection on standard input, so it never appears in a command line, a log or a file on the server.',
        ],
        code: {
          language: 'bash',
          code: `printf '%s\\n' "$POSTGRES_PASSWORD" | ssh "$SSH_USER@$SSH_HOST" \\
  'cd ~/portfolio && git pull --ff-only && sh deploy.sh'`,
        },
      },
      {
        id: 'hardening',
        heading: 'Locking down access',
        body: [
          'The deploy key is separate from my own key and is pinned to the deploy script in authorized_keys, so a leaked key can redeploy the site and do nothing else. SSH accepts keys only, the firewall allows SSH, HTTP and HTTPS and nothing more, and the OS installs security updates on its own.',
        ],
        code: {
          language: 'bash',
          code: `# authorized_keys: the deploy key can only run the deploy script
restrict,command="sh /root/portfolio/deploy.sh" ssh-ed25519 AAAA... github-deploy

# /etc/ssh/sshd_config.d/00-hardening.conf
PasswordAuthentication no
PermitRootLogin prohibit-password
AuthenticationMethods publickey`,
        },
      },
      {
        id: 'dependencies',
        heading: 'Dependency hygiene',
        body: [
          'Before going public the frontend and backend were audited with npm audit and pip-audit and brought to zero known vulnerabilities. The frontend image installs from the lockfile with npm ci, so what ships is exactly what was audited.',
        ],
      },
      {
        id: 'lessons',
        heading: 'What went wrong along the way',
        body: [
          'The first deploy failed because an old reverse proxy still held ports 80 and 443. After removing it, Caddy started but could not get a certificate: it was trying to resolve Let’s Encrypt through the host’s local DNS stub, which a container cannot reach. The container had been created during the failed deploy, when Docker could not finish attaching it to the network. Removing it and letting the pipeline recreate it fixed both the networking and the certificate.',
          'The lesson: when a container is created by a run that failed half-way, recreate it rather than starting it.',
        ],
      },
    ],
  },
  {
    slug: 'dog-breed-health',
    title: 'Dog breed health explorer: combining two public APIs',
    summary:
      'A daily job pulls two public dog APIs, matches their breeds, and loads the result into Postgres, so anyone can search 155 breeds by name or by the health conditions they are prone to.',
    stack: ['Python', 'FastAPI', 'PostgreSQL', 'asyncio', 'React', 'Astryx'],
    repo: 'https://github.com/MieliePede/portfolio',
    demo: '/dogs',
    status: 'published',
    sections: [
      {
        id: 'sources',
        heading: 'Two sources, two jobs',
        body: [
          'Breed Health Score publishes 155 breeds with a 0–100 health score, a grade, median lifespan from a 584,734-dog UK study, a flat-face flag, and the four or five conditions each breed is most prone to. It is the source of truth. Its licence (CC-BY-4.0) requires a visible credit wherever the data appears, so every page that shows it carries one.',
          'The Dog CEO API has no health data at all, only photos, so it is used for one thing: a gallery of extra photos per breed.',
        ],
      },
      {
        id: 'matching',
        heading: 'Matching breed names across APIs',
        body: [
          'The two APIs name breeds differently. Breed Health Score uses slugs like "golden-retriever"; Dog CEO uses a parent and sub-breed, like "retriever/golden". Only 68 of the 155 breeds matched exactly.',
          'Comparing names with the hyphens removed in both orders lines up most multi-word breeds automatically ("flat-coated-retriever" to "retriever/flatcoated"). A small, hand-checked alias table covers the rest, such as "bloodhound" to "hound/blood". That brought it to 118 of 155. The other 37 breeds simply are not in Dog CEO and keep Breed Health Score’s own photo.',
          'The trap was partial matches. Dog CEO’s list for a parent breed includes all of its sub-breeds: 142 of its 144 "greyhound" photos are Italian greyhounds. So a parent only matches on its own when it has no sub-breeds, and loose word matching is ruled out entirely, otherwise the Bull Terrier page would fill up with generic terriers. Both rules have tests.',
        ],
        code: {
          language: 'python',
          code: `def match_dogceo(slug, tree):
    if slug in ALIASES:                      # hand-checked exceptions
        return ALIASES[slug]
    c = compact(slug)                        # "german-shepherd-dog" -> "germanshepherd"
    if c in tree and not tree[c]:            # whole parent, only if it has no sub-breeds
        return c
    for parent, subs in tree.items():
        for sub in subs:
            if c in (sub + parent, parent + sub):
                return f"{parent}/{sub}"
    return None                              # no guess: keep the source's own photo`,
        },
      },
      {
        id: 'sync',
        heading: 'A sync job that never wipes good data',
        body: [
          'The backend syncs once a day inside the FastAPI process. Every deploy restarts the backend, so it only syncs on startup when the data is missing or more than a day old; redeploying does not hammer the source APIs.',
          'Everything fetched is treated as untrusted input. If the breed list comes back short or malformed, the sync stops and the existing rows stay. A failed detail or photo request for one breed falls back to what is already known. The new data is written in a single transaction, and breeds that disappeared upstream are removed only after the list has passed validation.',
        ],
        code: {
          language: 'python',
          code: `breeds = payload.get("breeds")
if not isinstance(breeds, list) or len(breeds) < 100:
    raise ValueError("expected 100+ breeds")   # abort: keep yesterday's data
...
async with conn.transaction():
    await conn.executemany(UPSERT, rows)
    await conn.execute("DELETE FROM breeds WHERE slug <> ALL($1)", slugs)`,
        },
      },
      {
        id: 'search',
        heading: 'Search',
        body: [
          'With 155 rows, one table with the conditions in a text array is enough; no join tables or search engine. One query matches a breed name or any of its conditions, so "hip" finds every breed prone to hip dysplasia.',
          'The first version matched anywhere in a word, so "hip" also found the Schipperke. Matching only at the start of a word fixed it: the search text is escaped so it can only match literally, then anchored with Postgres’s start-of-word marker. Sort options come from a fixed list rather than user input.',
        ],
        code: {
          language: 'sql',
          code: `-- $1 = '\\m' || escaped search text  ("\\m" = start of a word)
SELECT slug, name, health_score, grade, conditions
FROM breeds
WHERE name ~* $1
   OR EXISTS (SELECT 1 FROM unnest(conditions) c WHERE c ~* $1)
ORDER BY health_score DESC NULLS LAST, name;`,
        },
      },
      {
        id: 'analysis',
        heading: 'Is a healthy breed just a long-lived one?',
        body: [
          'The question behind the chart: are some breeds healthy but too short-lived to reach the conditions of old age? The obvious plot, health score against lifespan, gives r = 0.97, which looks like a striking result until you read the methodology: the score is 65% lifespan, mapped from 8 years to 15. The plot mostly shows how the score is built.',
          'The independent signal is the number of severe conditions on record. It also turned out to be what the score’s "condition burden" component really is: that component has only eight possible values, each set by the severe-condition count. Against lifespan it gives r = −0.39, a moderate link: longer-lived breeds tend to have fewer serious conditions, with plenty of exceptions.',
          'The gap the chart highlights is six breeds in the shortest-lived quarter with no severe conditions on record, such as the Akita and Afghan Hound. The source notes that its condition counts depend on how well a breed has been studied, so a short-lived breed with a clean record is a candidate for missing data rather than proof of good health.',
        ],
      },
    ],
  },
]
