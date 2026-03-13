'use client'
import React, { useId, useState } from 'react'

// Tech stack icons
import {
  SiPhp,
  SiGo,
  SiTypescript,
  SiJavascript,
  SiRuby,
  SiSharp,
  SiHtml5,
  SiCss3,
  SiLaravel,
  SiSymfony,
  SiReact,
  SiVuedotjs,
  SiRubyonrails,
  SiDotnet,
  SiMysql,
  SiPostgresql,
  SiRedis,
  SiElasticsearch,
  SiSqlite,
  SiDocker,
  SiKubernetes,
  SiAmazonwebservices,
  SiDatadog,
  SiJquery,
  SiGitlab,
  SiJest,
  SiCypress,
  SiNewrelic,
  SiGraphql,
  SiBitbucket,
  SiTerraform,
  SiRedux,
  SiJenkins,
  SiSentry,
  SiBootstrap,
  SiSass,
  SiGit,
  SiNginx,
  SiCakephp,
  SiAlgolia,
  SiAwslambda,
} from 'react-icons/si'
import {
  VscCode,
  VscServerProcess,
  VscDebugAll,
  VscChecklist,
  VscGitMerge,
  VscServer,
  VscSymbolInterface,
  VscRocket,
  VscDatabase,
  VscBeaker,
  VscBell,
  VscKey,
  VscPackage,
  VscGraph,
} from 'react-icons/vsc'

// Tech category mapping
export const TECH_CATEGORIES: Record<string, string[]> = {
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
export function getTechCategory(tech: string): string {
  const normalizedTech = tech.toLowerCase().trim()
  for (const [category, techs] of Object.entries(TECH_CATEGORIES)) {
    if (techs.some((t) => t.toLowerCase() === normalizedTech)) {
      return category
    }
  }
  return 'Other'
}

// Group technologies by category
export function groupTechByCategory(
  technologies: string[],
): Record<string, string[]> {
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
export function TechIcon({
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
export function TechPill({
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
export function TechIconButton({
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

// Company-level tech stack display with expand/collapse
export function TechStack({
  technologies,
  tone = 'default',
}: {
  technologies: string[]
  tone?: 'default' | 'plain'
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const contentId = useId()

  if (technologies.length === 0) return null

  const VISIBLE_COUNT = 5
  const visibleTechs = technologies.slice(0, VISIBLE_COUNT)
  const hiddenCount = technologies.length - VISIBLE_COUNT
  const groupedTechs = groupTechByCategory(technologies)

  const toggleExpand = () => setIsExpanded(!isExpanded)

  return (
    <div className="border-t border-neutral-200 bg-neutral-100/90 dark:border-neutral-700 dark:bg-neutral-800/70">
      <button
        type="button"
        className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black ${
          tone === 'plain'
            ? 'hover:bg-neutral-100/50 focus-visible:ring-neutral-400 focus-visible:ring-offset-white dark:hover:bg-neutral-800/20'
            : 'hover:bg-neutral-200/80 focus-visible:ring-emerald-500 focus-visible:ring-offset-white dark:hover:bg-neutral-700/60'
        }`}
        onClick={toggleExpand}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`flex flex-shrink-0 items-center gap-2 ${
              tone === 'plain'
                ? 'text-[11px] text-neutral-500 dark:text-neutral-400'
                : 'font-mono text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-100'
            }`}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <span className={`${isExpanded ? 'inline' : 'hidden sm:inline'}`}>
              Tech Stack
            </span>
          </div>

          {!isExpanded && (
            <div className="flex items-center gap-1.5 overflow-hidden">
              {visibleTechs.map((tech, i) => (
                <TechIconButton key={i} tech={tech} tone={tone} />
              ))}
              {hiddenCount > 0 && (
                <span
                  className={`font-mono text-xs ${
                    tone === 'plain'
                      ? 'text-neutral-500 dark:text-neutral-400'
                      : 'rounded bg-neutral-200 px-1.5 py-0.5 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100'
                  }`}
                >
                  +{hiddenCount} more
                </span>
              )}
            </div>
          )}
        </div>

        <svg
          className={`h-4 w-4 flex-shrink-0 text-neutral-600 transition-transform duration-200 dark:text-neutral-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div
        id={contentId}
        className={`transition-all duration-300 ease-in-out ${
          isExpanded
            ? 'max-h-[1000px] opacity-100'
            : 'max-h-0 overflow-hidden opacity-0'
        }`}
      >
        <div className="min-w-0 space-y-4 px-4 py-4">
          {Object.entries(groupedTechs)
            .filter(([, techs]) => techs.length > 0)
            .map(([category, techs], categoryIndex) => (
              <div
                key={category}
                className="min-w-0 transition-all duration-300"
                style={{
                  transitionDelay: isExpanded
                    ? `${categoryIndex * 50}ms`
                    : '0ms',
                  opacity: isExpanded ? 1 : 0,
                  transform: isExpanded ? 'translateY(0)' : 'translateY(-8px)',
                }}
              >
                <div
                  className={`mb-2 ${
                    tone === 'plain'
                      ? 'text-[11px] text-neutral-500 dark:text-neutral-400'
                      : 'font-mono text-[10px] uppercase tracking-wider text-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  {category}
                </div>
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {techs.map((tech, i) => (
                    <TechPill key={i} tech={tech} tone={tone} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
