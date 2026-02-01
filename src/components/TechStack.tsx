'use client';
import React, { useState } from "react";

// Tech stack icons
import {
    SiPhp, SiGo, SiTypescript, SiJavascript, SiRuby, SiSharp, SiHtml5, SiCss3,
    SiLaravel, SiSymfony, SiReact, SiVuedotjs, SiRubyonrails, SiDotnet,
    SiMysql, SiPostgresql, SiRedis, SiElasticsearch, SiSqlite,
    SiDocker, SiKubernetes, SiAmazonwebservices, SiDatadog,
    SiJquery, SiGitlab, SiJest, SiCypress,
    SiNewrelic, SiGraphql, SiBitbucket, SiTerraform,
    SiRedux, SiJenkins, SiSentry, SiBootstrap, SiSass, SiGit, SiNginx,
    SiCakephp, SiAlgolia, SiAwslambda
} from 'react-icons/si';
import {
    VscCode, VscServerProcess, VscDebugAll, VscChecklist, VscGitMerge,
    VscServer, VscSymbolInterface, VscRocket, VscDatabase, VscBeaker,
    VscBell, VscKey, VscPackage, VscGraph
} from 'react-icons/vsc';

// Tech category mapping
export const TECH_CATEGORIES: Record<string, string[]> = {
    'Languages': ['PHP', 'Go', 'TypeScript', 'JavaScript', 'Ruby', 'C#', 'HTML', 'CSS'],
    'Frameworks': ['Laravel', 'Symfony', 'React', 'React Native', 'Vue.js', 'Rails', '.NET', 'jQuery', 'Laminas', 'Phalcon', 'Xamarin', 'CakePHP', 'Yii2', 'ASP.NET MVC', 'Redux'],
    'Databases': ['MySQL', 'PostgreSQL', 'Redis', 'Elasticsearch', 'MSSQL', 'SQLite'],
    'Infrastructure': ['Docker', 'Kubernetes', 'AWS', 'Datadog', 'FrankenPHP', 'Road-Runner', 'SharePoint', 'Nginx', 'SQS', 'SNS', 'GitLab CI', 'Bitbucket Pipelines', 'Jenkins', 'Terraform', 'Capistrano', 'New Relic', 'Sentry', 'k6', 'Laravel Nova', 'Laravel Queues', 'OneSignal', 'AWS Secrets Manager', 'EC2', 'S3', 'RDS', 'Lambda', 'Logstash', 'Kibana', 'Bitbucket', 'Bugsnag', 'Algolia'],
    'Practices': ['REST API', 'REST', 'Microservices', 'CI/CD', 'DevOps', 'Agile', 'SCRUM', 'TDD', 'Unit Testing', 'GraphQL', 'gRPC', 'PHPUnit', 'Jest', 'Cypress', 'Playwright', 'RSpec', 'Bootstrap', 'SASS', 'Git']
};

// Get category for a technology
export function getTechCategory(tech: string): string {
    const normalizedTech = tech.toLowerCase().trim();
    for (const [category, techs] of Object.entries(TECH_CATEGORIES)) {
        if (techs.some(t => t.toLowerCase() === normalizedTech)) {
            return category;
        }
    }
    return 'Other';
}

// Group technologies by category
export function groupTechByCategory(technologies: string[]): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};

    technologies.forEach(tech => {
        const category = getTechCategory(tech);
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(tech);
    });

    // Sort categories in preferred order
    const orderedCategories = ['Languages', 'Frameworks', 'Databases', 'Infrastructure', 'Practices', 'Other'];
    const sortedGrouped: Record<string, string[]> = {};

    orderedCategories.forEach(cat => {
        if (grouped[cat]) {
            sortedGrouped[cat] = grouped[cat];
        }
    });

    return sortedGrouped;
}

// Technology icon component using react-icons
export function TechIcon({ tech, className = "w-3.5 h-3.5" }: { tech: string; className?: string }) {
    const normalizedTech = tech.toLowerCase();

    // Map of technology names to their icons
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
        // Languages
        'php': SiPhp,
        'go': SiGo,
        'typescript': SiTypescript,
        'javascript': SiJavascript,
        'ruby': SiRuby,
        'c#': SiSharp,
        'html': SiHtml5,
        'css': SiCss3,
        // Frameworks
        'laravel': SiLaravel,
        'symfony': SiSymfony,
        'react': SiReact,
        'react native': SiReact,
        'vue.js': SiVuedotjs,
        'rails': SiRubyonrails,
        '.net': SiDotnet,
        'redux': SiRedux,
        'cakephp': SiCakephp,
        // Databases
        'mysql': SiMysql,
        'postgresql': SiPostgresql,
        'redis': SiRedis,
        'elasticsearch': SiElasticsearch,
        'sqlite': SiSqlite,
        // Infrastructure & DevOps
        'docker': SiDocker,
        'kubernetes': SiKubernetes,
        'aws': SiAmazonwebservices,
        'datadog': SiDatadog,
        'gitlab ci': SiGitlab,
        'bitbucket': SiBitbucket,
        'bitbucket pipelines': SiBitbucket,
        'terraform': SiTerraform,
        'jenkins': SiJenkins,
        'nginx': SiNginx,
        'git': SiGit,
        // Monitoring
        'new relic': SiNewrelic,
        'sentry': SiSentry,
        'algolia': SiAlgolia,
        // Testing
        'jest': SiJest,
        'cypress': SiCypress,
        // API & Protocols
        'graphql': SiGraphql,
        // CSS
        'bootstrap': SiBootstrap,
        'sass': SiSass,
        // Tools
        'jquery': SiJquery,
        'lambda': SiAwslambda,
    };

    // VSCode icons for concepts/methods (monoline style)
    const conceptIcons: Record<string, React.ComponentType<{ className?: string }>> = {
        'rest api': VscSymbolInterface,
        'rest': VscSymbolInterface,
        'microservices': VscServerProcess,
        'ci/cd': VscGitMerge,
        'devops': VscServer,
        'agile': VscRocket,
        'scrum': VscRocket,
        'tdd': VscDebugAll,
        'unit testing': VscChecklist,
        'road-runner': VscRocket,
        'frankenphp': VscServerProcess,
        'laminas': VscCode,
        'phalcon': VscCode,
        'xamarin': VscCode,
        'mssql': VscDatabase,
        'sharepoint': VscServer,
        // AWS Services
        'sqs': VscPackage,
        'sns': VscBell,
        'ec2': VscServer,
        's3': VscPackage,
        'rds': VscDatabase,
        'aws secrets manager': VscKey,
        // Testing & Quality
        'phpunit': VscBeaker,
        'rspec': VscBeaker,
        'k6': VscGraph,
        'playwright': VscBeaker,
        // Other tools
        'logstash': VscServerProcess,
        'kibana': VscGraph,
        'capistrano': VscRocket,
        'onesignal': VscBell,
        'laravel nova': VscCode,
        'laravel queues': VscPackage,
        'bugsnag': VscDebugAll,
        'yii2': VscCode,
        'asp.net mvc': SiDotnet,
        // API & Protocols
        'grpc': VscSymbolInterface,
    };

    const IconComponent = iconMap[normalizedTech] || conceptIcons[normalizedTech];

    if (IconComponent) {
        return <IconComponent className={className} />;
    }

    // Default code icon for unknown technologies
    return <VscCode className={className} />;
}

// Technology pill component for expanded view
export function TechPill({ tech }: { tech: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
            <TechIcon tech={tech} className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
            {tech}
        </span>
    );
}

// Technology icon (collapsed view)
export function TechIconButton({ tech }: { tech: string }) {
    return (
        <span
            className="inline-flex items-center justify-center w-7 h-7 flex-shrink-0 aspect-square rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
            aria-label={tech}
        >
            <TechIcon tech={tech} className="w-4 h-4 flex-shrink-0" />
        </span>
    );
}

// Company-level tech stack display with expand/collapse
export function TechStack({
    technologies
}: {
    technologies: string[];
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (technologies.length === 0) return null;

    const VISIBLE_COUNT = 5;
    const visibleTechs = technologies.slice(0, VISIBLE_COUNT);
    const hiddenCount = technologies.length - VISIBLE_COUNT;
    const groupedTechs = groupTechByCategory(technologies);

    const toggleExpand = () => setIsExpanded(!isExpanded);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpand();
        }
    };

    return (
        <div className="bg-neutral-50/50 dark:bg-neutral-800/30 border-t border-neutral-100 dark:border-neutral-800">
            {/* Header row - always visible, clickable */}
            <div
                className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer select-none hover:bg-neutral-100/50 dark:hover:bg-neutral-700/30 transition-colors"
                onClick={toggleExpand}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-controls="tech-stack-content"
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Title - hide text on mobile when collapsed, show when expanded */}
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-300 uppercase tracking-wider flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        <span className={`${isExpanded ? 'inline' : 'hidden sm:inline'}`}>Tech Stack</span>
                    </div>

                    {/* Collapsed preview */}
                    {!isExpanded && (
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            {visibleTechs.map((tech, i) => (
                                <TechIconButton key={i} tech={tech} />
                            ))}
                            {hiddenCount > 0 && (
                                <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 bg-neutral-200/50 dark:bg-neutral-700/50 rounded">
                                    +{hiddenCount} more
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Expand/collapse chevron */}
                <svg
                    className={`w-4 h-4 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 flex-shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* Expanded content */}
            <div
                id="tech-stack-content"
                className={`transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}
            >
                <div className="px-4 py-4 space-y-4 min-w-0">
                    {Object.entries(groupedTechs).filter(([, techs]) => techs.length > 0).map(([category, techs], categoryIndex) => (
                        <div
                            key={category}
                            className="transition-all duration-300 min-w-0"
                            style={{
                                transitionDelay: isExpanded ? `${categoryIndex * 50}ms` : '0ms',
                                opacity: isExpanded ? 1 : 0,
                                transform: isExpanded ? 'translateY(0)' : 'translateY(-8px)'
                            }}
                        >
                            <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                {category}
                            </div>
                            <div className="flex flex-wrap gap-1.5 min-w-0">
                                {techs.map((tech, i) => (
                                    <TechPill key={i} tech={tech} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
