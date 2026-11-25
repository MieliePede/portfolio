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
    slug: 'data-handling',
    title: 'Data handling case study',
    summary: 'Coming soon.',
    stack: [],
    status: 'planned',
    sections: [],
  },
]
