// Tech stack icons
import {
  SiAlgolia,
  SiAmazonwebservices,
  SiAwslambda,
  SiBitbucket,
  SiBootstrap,
  SiCakephp,
  SiCss3,
  SiCypress,
  SiDatadog,
  SiDocker,
  SiDotnet,
  SiElasticsearch,
  SiGit,
  SiGitlab,
  SiGo,
  SiGraphql,
  SiHtml5,
  SiJavascript,
  SiJenkins,
  SiJest,
  SiJquery,
  SiKubernetes,
  SiLaravel,
  SiMysql,
  SiNewrelic,
  SiNginx,
  SiPhp,
  SiPostgresql,
  SiReact,
  SiRedis,
  SiRedux,
  SiRuby,
  SiRubyonrails,
  SiSass,
  SiSentry,
  SiSharp,
  SiSqlite,
  SiSymfony,
  SiTerraform,
  SiTypescript,
  SiVuedotjs,
} from 'react-icons/si'
import {
  VscBeaker,
  VscBell,
  VscChecklist,
  VscCode,
  VscDatabase,
  VscDebugAll,
  VscGitMerge,
  VscGraph,
  VscKey,
  VscPackage,
  VscRocket,
  VscServer,
  VscServerProcess,
  VscSymbolInterface,
} from 'react-icons/vsc'

import { TechStackDisclosure } from '@/components/TechStackDisclosure'

// Tech category mapping
const TECH_CATEGORIES: Record<string, string[]> = {
  Languages: [
    'PHP',
    'Go',
    'TypeScript',
    'JavaScript',
    'Ruby',
    'C#',
    'HTML',
    'CSS',
  ],
  Frameworks: [
    'Laravel',
    'Symfony',
    'React',
    'React Native',
    'Vue.js',
    'Rails',
    '.NET',
    'jQuery',
    'Laminas',
    'Phalcon',
    'Xamarin',
    'CakePHP',
    'Yii2',
    'ASP.NET MVC',
    'Redux',
  ],
  Databases: [
    'MySQL',
    'PostgreSQL',
    'Redis',
    'Elasticsearch',
    'MSSQL',
    'SQLite',
  ],
  Infrastructure: [
    'Docker',
    'Kubernetes',
    'AWS',
    'Datadog',
    'FrankenPHP',
    'Road-Runner',
    'SharePoint',
    'Nginx',
    'SQS',
    'SNS',
    'GitLab CI',
    'Bitbucket Pipelines',
    'Jenkins',
    'Terraform',
    'Capistrano',
    'New Relic',
    'Sentry',
    'k6',
    'Laravel Nova',
    'Laravel Queues',
    'OneSignal',
    'AWS Secrets Manager',
    'EC2',
    'S3',
    'RDS',
    'Lambda',
    'Logstash',
    'Kibana',
    'Bitbucket',
    'Bugsnag',
    'Algolia',
  ],
  Practices: [
    'REST API',
    'REST',
    'Microservices',
    'CI/CD',
    'DevOps',
    'Agile',
    'SCRUM',
    'TDD',
    'Unit Testing',
    'GraphQL',
    'gRPC',
    'PHPUnit',
    'Jest',
    'Cypress',
    'Playwright',
    'RSpec',
    'Bootstrap',
    'SASS',
    'Git',
  ],
}

// Get category for a technology
function getTechCategory(tech: string): string {
  const normalizedTech = tech.toLowerCase().trim()
  for (const [category, techs] of Object.entries(TECH_CATEGORIES)) {
    if (techs.some((t) => t.toLowerCase() === normalizedTech)) {
      return category
    }
  }
  return 'Other'
}

// Group technologies by category
function groupTechByCategory(technologies: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}

  technologies.forEach((tech) => {
    const category = getTechCategory(tech)
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(tech)
  })

  // Sort categories in preferred order
  const orderedCategories = [
    'Languages',
    'Frameworks',
    'Databases',
    'Infrastructure',
    'Practices',
    'Other',
  ]
  const sortedGrouped: Record<string, string[]> = {}

  orderedCategories.forEach((cat) => {
    if (grouped[cat]) {
      sortedGrouped[cat] = grouped[cat]
    }
  })

  return sortedGrouped
}

// Technology icon component using react-icons
function TechIcon({
  tech,
  className = 'w-3.5 h-3.5',
}: {
  tech: string
  className?: string
}) {
  const normalizedTech = tech.toLowerCase()

  // Map of technology names to their icons
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    // Languages
    php: SiPhp,
    go: SiGo,
    typescript: SiTypescript,
    javascript: SiJavascript,
    ruby: SiRuby,
    'c#': SiSharp,
    html: SiHtml5,
    css: SiCss3,
    // Frameworks
    laravel: SiLaravel,
    symfony: SiSymfony,
    react: SiReact,
    'react native': SiReact,
    'vue.js': SiVuedotjs,
    rails: SiRubyonrails,
    '.net': SiDotnet,
    redux: SiRedux,
    cakephp: SiCakephp,
    // Databases
    mysql: SiMysql,
    postgresql: SiPostgresql,
    redis: SiRedis,
    elasticsearch: SiElasticsearch,
    sqlite: SiSqlite,
    // Infrastructure & DevOps
    docker: SiDocker,
    kubernetes: SiKubernetes,
    aws: SiAmazonwebservices,
    datadog: SiDatadog,
    'gitlab ci': SiGitlab,
    bitbucket: SiBitbucket,
    'bitbucket pipelines': SiBitbucket,
    terraform: SiTerraform,
    jenkins: SiJenkins,
    nginx: SiNginx,
    git: SiGit,
    // Monitoring
    'new relic': SiNewrelic,
    sentry: SiSentry,
    algolia: SiAlgolia,
    // Testing
    jest: SiJest,
    cypress: SiCypress,
    // API & Protocols
    graphql: SiGraphql,
    // CSS
    bootstrap: SiBootstrap,
    sass: SiSass,
    // Tools
    jquery: SiJquery,
    lambda: SiAwslambda,
  }

  // VSCode icons for concepts/methods (monoline style)
  const conceptIcons: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    'rest api': VscSymbolInterface,
    rest: VscSymbolInterface,
    microservices: VscServerProcess,
    'ci/cd': VscGitMerge,
    devops: VscServer,
    agile: VscRocket,
    scrum: VscRocket,
    tdd: VscDebugAll,
    'unit testing': VscChecklist,
    'road-runner': VscRocket,
    frankenphp: VscServerProcess,
    laminas: VscCode,
    phalcon: VscCode,
    xamarin: VscCode,
    mssql: VscDatabase,
    sharepoint: VscServer,
    // AWS Services
    sqs: VscPackage,
    sns: VscBell,
    ec2: VscServer,
    s3: VscPackage,
    rds: VscDatabase,
    'aws secrets manager': VscKey,
    // Testing & Quality
    phpunit: VscBeaker,
    rspec: VscBeaker,
    k6: VscGraph,
    playwright: VscBeaker,
    // Other tools
    logstash: VscServerProcess,
    kibana: VscGraph,
    capistrano: VscRocket,
    onesignal: VscBell,
    'laravel nova': VscCode,
    'laravel queues': VscPackage,
    bugsnag: VscDebugAll,
    yii2: VscCode,
    'asp.net mvc': SiDotnet,
    // API & Protocols
    grpc: VscSymbolInterface,
  }

  const IconComponent = iconMap[normalizedTech] || conceptIcons[normalizedTech]

  if (IconComponent) {
    return <IconComponent className={className} />
  }

  // Default code icon for unknown technologies
  return <VscCode className={className} />
}

// Technology pill component for expanded view
function TechPill({
  tech,
  tone = 'default',
}: {
  tech: string
  tone?: 'default' | 'plain'
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-xs ${
        tone === 'plain'
          ? 'border-neutral-200 bg-transparent text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
          : 'border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100'
      }`}
    >
      <TechIcon tech={tech} className="h-3.5 w-3.5 flex-shrink-0 opacity-80" />
      {tech}
    </span>
  )
}

// Technology icon (collapsed view)
function TechIconButton({
  tech,
  tone = 'default',
}: {
  tech: string
  tone?: 'default' | 'plain'
}) {
  return (
    <span
      className={`inline-flex aspect-square h-7 w-7 flex-shrink-0 items-center justify-center rounded border ${
        tone === 'plain'
          ? 'border-neutral-200 bg-transparent text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
          : 'border-neutral-300 bg-neutral-100 text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200'
      }`}
      role="img"
      aria-label={tech}
    >
      <TechIcon tech={tech} className="h-4 w-4 flex-shrink-0" />
    </span>
  )
}

function TechStackPreview({
  visibleTechs,
  hiddenCount,
  tone,
}: {
  visibleTechs: string[]
  hiddenCount: number
  tone: 'default' | 'plain'
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-hidden">
      {visibleTechs.map((tech, index) => (
        <TechIconButton key={`${tech}-${index}`} tech={tech} tone={tone} />
      ))}
      {hiddenCount > 0 ? (
        <span
          className={`font-mono text-xs ${
            tone === 'plain'
              ? 'text-neutral-600 dark:text-neutral-300'
              : 'rounded bg-neutral-200 px-1.5 py-0.5 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100'
          }`}
        >
          +{hiddenCount} more
        </span>
      ) : null}
    </div>
  )
}

function TechStackDetails({
  groupedTechs,
  tone,
}: {
  groupedTechs: Record<string, string[]>
  tone: 'default' | 'plain'
}) {
  return (
    <div className="min-w-0 space-y-4 px-4 py-4">
      {Object.entries(groupedTechs)
        .filter(([, techs]) => techs.length > 0)
        .map(([category, techs]) => (
          <div key={category} className="min-w-0">
            <div
              className={`mb-2 ${
                tone === 'plain'
                  ? 'text-[11px] text-neutral-600 dark:text-neutral-300'
                  : 'font-mono text-[10px] uppercase tracking-wider text-neutral-700 dark:text-neutral-200'
              }`}
            >
              {category}
            </div>
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {techs.map((tech, index) => (
                <TechPill key={`${tech}-${index}`} tech={tech} tone={tone} />
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}

export function TechStack({
  technologies,
  tone = 'default',
  contentId,
}: {
  technologies: string[]
  tone?: 'default' | 'plain'
  contentId?: string
}) {
  if (technologies.length === 0) return null

  const visibleCount = 5
  const visibleTechs = technologies.slice(0, visibleCount)
  const hiddenCount = technologies.length - visibleCount
  const groupedTechs = groupTechByCategory(technologies)
  const resolvedContentId =
    contentId ??
    `tech-stack-${technologies
      .slice(0, 3)
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')}`

  return (
    <TechStackDisclosure tone={tone} contentId={resolvedContentId}>
      <TechStackPreview
        visibleTechs={visibleTechs}
        hiddenCount={hiddenCount}
        tone={tone}
      />
      <TechStackDetails groupedTechs={groupedTechs} tone={tone} />
    </TechStackDisclosure>
  )
}
