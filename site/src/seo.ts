import { COURSE_LINKS, PARTS, REPO_URL, SITE_URL, WEEKS, findWeek } from './course'
import { LESSON_MINUTES } from './lessons'
import { HOME, NOTATION, routePath, week, type Route } from './router'

// What search engines, link previews and AI assistants are told about each page.
// Everything here is derived from the course outline, so it cannot drift from it.

export const SITE_NAME = 'Reinforcement Learning Companion'
export const AUTHOR = 'Prabhu Nithin Gollapudi'
const CONTENT_LICENCE = 'https://creativecommons.org/licenses/by/4.0/'

const HOME_DESCRIPTION =
  'A free, visual 16-week reinforcement learning course with interactive playgrounds, quizzes and Python labs: ' +
  'MDPs, Q-learning, DQN, policy gradients, PPO, actor-critic, offline RL, bandits, model-based RL, meta-RL, and ' +
  'RL for language models and robots. An unofficial companion to Stanford CS 234 and CS 224R.'

export interface PageMeta {
  /** Full public address of the page. */
  url: string
  title: string
  description: string
  /** schema.org description of the page, for search engines. */
  jsonLd: Record<string, unknown>
}

export const ALL_ROUTES: Route[] = [HOME, NOTATION, ...WEEKS.map((w) => week(w.n))]

const urlOf = (route: Route) => SITE_URL + routePath(route)

const author = { '@type': 'Person', name: AUTHOR, url: REPO_URL.slice(0, REPO_URL.lastIndexOf('/')) }

const lessonLd = (n: number) => {
  const { week: w, part } = findWeek(n)!
  return {
    '@type': 'LearningResource',
    name: `Week ${w.n}: ${w.title}`,
    description: w.summary,
    url: urlOf(week(w.n)),
    position: w.n,
    learningResourceType: 'Lesson',
    about: part.title,
    teaches: w.topics,
    ...(LESSON_MINUTES[w.n] ? { timeRequired: `PT${LESSON_MINUTES[w.n]}M` } : {}),
  }
}

export function pageMeta(route: Route): PageMeta {
  if (route.page === 'week') {
    const { week: w } = findWeek(route.n)!
    return {
      url: urlOf(route),
      title: `${w.title} (Week ${w.n}) | ${SITE_NAME}`,
      description: `${w.summary} Covers: ${w.topics.join('; ')}. With figures, interactive playgrounds, a quiz and a Python lab.`,
      jsonLd: {
        '@context': 'https://schema.org',
        ...lessonLd(w.n),
        inLanguage: 'en',
        isAccessibleForFree: true,
        license: CONTENT_LICENCE,
        author,
        isPartOf: { '@type': 'Course', name: SITE_NAME, url: SITE_URL },
      },
    }
  }
  if (route.page === 'notation') {
    return {
      url: urlOf(route),
      title: `Notation: CS 234 and CS 224R side by side | ${SITE_NAME}`,
      description:
        'How Stanford CS 234 and CS 224R write the same reinforcement learning objects: states, actions, dynamics, rewards, policies, returns and value functions.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Reinforcement learning notation',
        url: urlOf(route),
        isPartOf: { '@type': 'Course', name: SITE_NAME, url: SITE_URL },
      },
    }
  }
  return {
    url: SITE_URL,
    title: `${SITE_NAME}: a visual 16-week course`,
    description: HOME_DESCRIPTION,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: SITE_NAME,
      description: HOME_DESCRIPTION,
      url: SITE_URL,
      inLanguage: 'en',
      isAccessibleForFree: true,
      license: CONTENT_LICENCE,
      coursePrerequisites: 'Machine learning, linear algebra, probability and Python programming.',
      provider: author,
      author,
      offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD', category: 'Free' },
      hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online' },
      teaches: WEEKS.map((w) => w.title),
      hasPart: WEEKS.map((w) => lessonLd(w.n)),
    },
  }
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * The tags for a page's <head>. `up` is the relative path back to the site root
 * ('' on the home page, '../../' on a week).
 */
export function headTags(route: Route, up: string): string {
  const meta = pageMeta(route)
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  // Inside a script element only "<" needs care: it must not be able to close the tag.
  const jsonLd = JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="author" content="${escapeHtml(AUTHOR)}" />`,
    `<link rel="canonical" href="${meta.url}" />`,
    `<meta property="og:type" content="${route.page === 'week' ? 'article' : 'website'}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${meta.url}" />`,
    `<meta property="og:image" content="${SITE_URL}social-card.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${SITE_NAME}: a visual 16-week course with playgrounds and Python labs" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<link rel="alternate" type="text/plain" href="${up}llms.txt" title="Plain-text guide to this site for AI assistants" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join('\n    ')
}

/** sitemap.xml: one entry per page. */
export function sitemap(lastModified: string): string {
  const entries = ALL_ROUTES.map(
    (route) => `  <url>\n    <loc>${urlOf(route)}</loc>\n    <lastmod>${lastModified}</lastmod>\n  </url>`,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
}

/**
 * llms.txt: a plain-text map of the site for AI assistants and agents, in the
 * format proposed at llmstxt.org.
 */
export function llmsTxt(): string {
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${HOME_DESCRIPTION}`,
    '',
    'It is written for people who already know machine learning, the maths and how to program, and have not studied',
    'reinforcement learning formally. Every week has the same parts: a big picture, figures, interactive playgrounds,',
    'plain-language restatements, a few folded derivations, a Python lab, a quiz and a recap. Every number a lesson',
    'quotes comes from a deterministic simulation that is pinned by a test.',
    '',
    'This is an independent study aid. It is not affiliated with, endorsed by, or produced by Stanford University or',
    'the instructors of either course. It links to the lecture slides and does not copy them.',
    '',
    `Author: ${AUTHOR}. Lesson text and figures: CC BY 4.0. Code: MIT.`,
    '',
  ]
  for (const part of PARTS) {
    lines.push(`## Part ${part.n}: ${part.title}`, '')
    for (const w of part.weeks) {
      lines.push(`- [Week ${w.n}: ${w.title}](${urlOf(week(w.n))}): ${w.summary} Topics: ${w.topics.join('; ')}.`)
    }
    lines.push('')
  }
  lines.push(
    '## Reference',
    '',
    `- [Notation](${urlOf(NOTATION)}): how CS 234 and CS 224R write the same objects.`,
    `- [Source code and Python labs](${REPO_URL}): the site, one lab folder per week with tests and a reference solution, and instructions to run everything locally.`,
    '',
    '## Optional',
    '',
    ...COURSE_LINKS.map((l) => `- [${l.label}](${l.url})`),
    '',
  )
  return lines.join('\n')
}

/** The page GitHub Pages shows for an address that does not exist. */
export function notFoundPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Page not found | ${SITE_NAME}</title>
    <style>
      body { font: 16px/1.6 system-ui, sans-serif; max-width: 34rem; margin: 18vh auto; padding: 0 16px; color: #1c2430; background: #fbfaf7; }
      a { color: #1f5fbf; }
      @media (prefers-color-scheme: dark) { body { color: #e8eaee; background: #14171c; } a { color: #8ab4f8; } }
    </style>
  </head>
  <body>
    <h1>Page not found</h1>
    <p>There is no page at this address. The course has 16 weeks, and its front page lists them all.</p>
    <p><a href="${SITE_URL}">Go to the ${SITE_NAME}</a></p>
  </body>
</html>
`
}
