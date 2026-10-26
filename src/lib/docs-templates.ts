import type { JSONContent } from '@tiptap/core'

const p = (text?: string): JSONContent => ({
  type: 'paragraph',
  ...(text ? { content: [{ type: 'text', text }] } : {}),
})
const h = (level: 1 | 2 | 3, text: string): JSONContent => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
})
const bullet = (items: string[]): JSONContent => ({
  type: 'bulletList',
  content: items.map((text) => ({
    type: 'listItem',
    content: [p(text)],
  })),
})
const todo = (items: [string, boolean][]): JSONContent => ({
  type: 'taskList',
  content: items.map(([text, checked]) => ({
    type: 'taskItem',
    attrs: { checked },
    content: [p(text)],
  })),
})

export type DocTemplate = {
  id: string
  name: string
  title: string
  content: JSONContent
}

export const TEMPLATES: DocTemplate[] = [
  {
    id: 'blank',
    name: 'Blank document',
    title: 'Untitled document',
    content: { type: 'doc', content: [p()] },
  },
  {
    id: 'notes',
    name: 'Meeting notes',
    title: 'Weekly Team Sync — Notes',
    content: {
      type: 'doc',
      content: [
        h(1, 'Weekly Team Sync'),
        p('Date: October 27, 2026 · Attendees: You, Aisha, Marco, Priya'),
        h(2, 'Agenda'),
        bullet(['Progress review from last week', 'Blockers and dependencies', 'Plan for the next milestone']),
        h(2, 'Discussion'),
        p('The team walked through the current sprint. Overall progress is on track, but the review step needs a second pair of eyes before Friday.'),
        h(2, 'Action items'),
        todo([
          ['Share the updated timeline with stakeholders', true],
          ['Review the pull request and leave comments', false],
          ['Draft the outline for the next milestone', false],
        ]),
      ],
    },
  },
  {
    id: 'proposal',
    name: 'Project proposal',
    title: 'Project Proposal — Draft',
    content: {
      type: 'doc',
      content: [
        h(1, 'Project Proposal'),
        h(2, 'Overview'),
        p('This proposal outlines the scope, goals, and timeline for the upcoming project. It is intended to align stakeholders on what will be delivered and why it matters.'),
        h(2, 'Goals'),
        bullet([
          'Ship a working end-to-end version within four weeks',
          'Keep the feedback loop under 48 hours',
          'Measure impact with clear, agreed metrics',
        ]),
        h(2, 'Plan'),
        p('Weeks 1–2 focus on the core build. Weeks 3–4 add polish, testing, and documentation. Reviews happen at the end of each week.'),
        h(2, 'Risks'),
        p('The main risk is scope creep during the build phase. Mitigation: freeze requirements after week one and route changes through a short weekly review.'),
      ],
    },
  },
  {
    id: 'resume',
    name: 'Resume',
    title: 'Resume — Your Name',
    content: {
      type: 'doc',
      content: [
        h(1, 'Your Name'),
        p('City · you@example.com · linkedin.com/in/yourname'),
        h(2, 'Summary'),
        p('Full stack developer who ships fast with AI-assisted workflows. Strong in TypeScript, React, and Node.js, with a habit of turning vague requirements into working software.'),
        h(2, 'Experience'),
        h(3, 'Software Engineer — Acme Inc (2024–Present)'),
        bullet([
          'Built and maintained customer-facing web features used by 10k+ users',
          'Reduced page load time by 40% through caching and bundle tuning',
          'Introduced an AI review step that cut QA cycles in half',
        ]),
        h(2, 'Skills'),
        p('TypeScript · React · Next.js · Node.js · Prisma · PostgreSQL · Tailwind CSS'),
      ],
    },
  },
  {
    id: 'letter',
    name: 'Letter',
    title: 'Letter — Draft',
    content: {
      type: 'doc',
      content: [
        p('October 27, 2026'),
        p('Dear Reader,'),
        p(
          'I am writing to follow up on our recent conversation. The ideas we discussed felt promising, and I wanted to capture them in writing while they are still fresh.'
        ),
        p(
          'In short, the plan is to start small, validate quickly, and expand only what works. I would be glad to walk through the details at your convenience.'
        ),
        p('Kind regards,'),
        p('Your Name'),
      ],
    },
  },
]
