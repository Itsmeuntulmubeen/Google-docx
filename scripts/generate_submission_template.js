// generate_submission_template.js — Ajaia AI-Native Full Stack Developer assessment
// Submission template docx: cover (R1/DS-1) + TOC (Roman) + 8-section body (Arabic)
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, SectionType, NumberFormat,
  TableOfContents, PageOrientation,
} = require("docx");
const fs = require("fs");
const L = require("./tpl_lib.js");

const OUT = "/home/z/my-project/download/Ajaia-Assessment-Submission-Template.docx";

// ── Page geometry (common-rules.md defaults) ──
const pgSize = { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

// ── Cover config ──
const coverConfig = {
  title: "Assessment Submission",
  subtitle: "AI-Native Full Stack Developer — Take-Home Response Template (240 Minutes)",
  englishLabel: "TECHNICAL ASSESSMENT",
  metaLines: [
    "Candidate: \u3010Your Name\u3011",
    "Company: Ajaia LLC",
    "Role Track: AI-Native Full Stack Developer",
    "Date: \u3010YYYY-MM-DD\u3011",
    "Time Used: \u3010HH:MM\u3011 of 240 minutes",
  ],
  footerLeft: "Ajaia LLC — Technical Assessment",
  footerRight: "Companion to the code repository",
  palette: {
    bg: L.P.bg, accent: L.P.accent,
    titleColor: L.P.cover.titleColor, subtitleColor: L.P.cover.subtitleColor,
    metaColor: L.P.cover.metaColor, footerColor: L.P.cover.footerColor,
  },
};

// ── Front matter: TOC (Roman-numbered section) ──
const frontMatter = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 360, line: 312 },
    children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, color: L.P.headings, font: L.FONT_HEAD })],
  }),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({
    spacing: { before: 200, line: 312 },
    children: [new TextRun({
      text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \"Update Field.\"",
      italics: true, size: 18, color: "888888", font: L.FONT_BODY,
    })],
  }),
  // No trailing PageBreak: the body starts in a new NEXT_PAGE section (blank-page rule)
];

// ═══════════════════════════ BODY ═══════════════════════════
const bodyChildren = [];
const push = (...els) => els.forEach(e => e && bodyChildren.push(e));

// ── 1. Submission Overview ──
push(L.h1("1. Submission Overview and How to Use This Template"));
push(L.body(
  "This document is the written companion to the code submission for the Ajaia AI-Native Full Stack Developer take-home assessment. It is organized so that each section maps directly to one of the four published evaluation criteria: AI leverage, execution quality, decision-making, and communication. Every section pairs a short note on what reviewers look for with structured placeholders, marked with full-width brackets \u3010like this\u3011, that must be replaced with your own content. Example rows inside tables illustrate the expected level of specificity; edit them to reflect your actual work or delete them rather than submitting them as-is."
));
push(L.body(
  "The template is designed around a simple operating rhythm for a 240-minute session. Sections 1 and 2 are completed in the first fifteen minutes, before any code is written, because a written restatement and an explicit assumption list prevent the most common failure mode: building the wrong thing well. Sections 4 and 6 are maintained incrementally while working, since reconstructing a process log after the fact produces weak evidence. The final twenty-five minutes are reserved for Sections 5, 7, and 8, which convert raw work into reviewer-readable signal. Keep the finished document within roughly five pages; concision is itself part of the communication score."
));
push(L.callout("Operating rule:", "show the reasoning, not just the artifact. Reviewers are expected to spend about ten minutes per submission, so every section below is written to be verifiable at a glance rather than impressive at length."));
push(L.gap());
push(L.caption("Table 1. Submission metadata"));
push(L.makeTable([28, 72],
  ["Field", "Value"],
  [
    ["Candidate", "\u3010Your Name\u3011"],
    ["Role track", "AI-Native Full Stack Developer"],
    ["Assessment window", "\u3010start time\u3011 to \u3010end time\u3011 (240 minutes)"],
    ["Time used", "\u3010HH:MM\u3011"],
    ["Repository", "\u3010repository URL\u3011"],
    ["Live demo (optional)", "\u3010URL, or state not deployed\u3011"],
  ]
));
push(L.gap());
push(L.caption("Table 2. Where each grading criterion is evidenced"));
push(L.makeTable([30, 70],
  ["Criterion", "Where it is evidenced in this document"],
  [
    ["AI leverage", "Section 6 — prompt log, iteration story, human-in-the-loop checkpoints"],
    ["Execution quality", "Sections 3 and 7 — architecture decisions and runnable verification"],
    ["Decision-making", "Sections 4 and 5 — time-boxed plan, tradeoffs, and scope cuts"],
    ["Communication", "The entire document — structure, concision, and table discipline"],
  ]
));
push(L.gap());

// ── 2. Task Restatement & Assumptions ──
push(L.h1("2. Task Restatement and Assumptions"));
push(L.body(
  "A submission that opens with the task restated in the candidate's own words immediately differentiates itself. The restatement proves the brief was understood rather than skimmed, and it surfaces misreadings while they are still cheap to fix. Reviewers explicitly reward candidates who handle ambiguity by naming it, choosing a reasonable default, and moving on, instead of either blocking on a question or silently guessing. State each assumption with its blast radius so a reviewer can see which guesses are safe and which carry risk."
));
push(L.h2("2.1 Requirements in My Own Words"));
push(L.body(
  "\u3010Restate the core deliverable, the hard constraints (time, stack, evaluation focus), and the success criteria in three to five sentences. Do not copy the brief verbatim; paraphrase it the way you would explain it to a teammate joining mid-project. Finish with one sentence on what you consider the primary risk to on-time delivery.\u3011"
));
push(L.h2("2.2 Ambiguities and Assumptions"));
push(L.body(
  "List every ambiguity encountered while reading the brief and building, together with the assumption that unblocked progress. The example rows below are pre-filled with the assumptions most assessments share; replace or extend them with the ones specific to your brief."
));
push(L.caption("Table 3. Ambiguity log with working assumptions"));
push(L.makeTable([6, 34, 40, 20],
  ["#", "Ambiguity identified", "Assumption made to stay unblocked", "Impact if wrong"],
  [
    ["1", "Deployment expectation unclear", "Assume local run only (npm run dev); deploy only if it costs under 10 minutes", "Low — reviewer runs from README"],
    ["2", "Authentication scope unspecified", "Assume single-user, no login; record as a scope decision in Section 5", "Medium — data model stays simpler"],
    ["3", "AI provider and key availability", "Assume one LLM provider with a mocked fallback so the demo never breaks without a key", "High — AI feature must degrade gracefully"],
    ["4", "\u3010ambiguity from the actual brief\u3011", "\u3010assumption that unblocked progress\u3011", "\u3010High / Medium / Low\u3011"],
  ]
));
push(L.gap());

// ── 3. Architecture & Design ──
push(L.h1("3. Architecture and Design"));
push(L.body(
  "The architecture section demonstrates the simplest design that fully satisfies the brief. The discipline being scored is subtraction: every component must earn its place under a 240-minute constraint. A compact stack table with one-line rationales, a data model of two to three tables, and a short API surface communicate competence faster than prose. The defaults below reflect the recommended baseline (Next.js with a file-backed database) and should be adjusted wherever the actual task dictates a different shape."
));
push(L.h2("3.1 Stack and Rationale"));
push(L.caption("Table 4. Selected stack with one-line rationales"));
push(L.makeTable([22, 32, 46],
  ["Layer", "Choice", "Rationale"],
  [
    ["Frontend", "Next.js (App Router) + TypeScript", "One language end to end; route handlers remove the need for a separate backend"],
    ["UI system", "Tailwind CSS + component library", "Acceptable visual quality in minutes, no custom design time"],
    ["Database", "SQLite via Prisma", "Zero operations overhead; Postgres remains a connection-string swap"],
    ["AI integration", "Provider SDK + mocked fallback", "One working AI feature even when no API key is present"],
    ["Validation", "Zod at API boundaries", "Cheap robustness signal; typed inputs end to end"],
    ["Testing", "3 to 5 happy-path API tests", "Demonstrates intent without consuming the buffer"],
  ]
));
push(L.gap());
push(L.h2("3.2 Data Model"));
push(L.body(
  "\u3010List every table with its key fields and the relationships between them. Keep it to two or three tables, and state explicitly what you left out of the model. Example shape: Item (id, title, status, createdAt) and AiInteraction (id, entityType, prompt, response, model, latencyMs, createdAt) — the second table doubles as the evidence store for Section 6.\u3011"
));
push(L.h2("3.3 API Surface"));
push(L.caption("Table 5. HTTP endpoints"));
push(L.makeTable([16, 34, 50],
  ["Method", "Path", "Purpose"],
  [
    ["GET", "/api/items", "List with filter and pagination"],
    ["POST", "/api/items", "Create with schema validation"],
    ["GET", "/api/items/:id", "Retrieve a single record"],
    ["PATCH", "/api/items/:id", "Partial update"],
    ["DELETE", "/api/items/:id", "Remove"],
    ["POST", "/api/ai", "\u3010the AI feature action; plain JSON unless streaming is UX-critical\u3011"],
  ]
));
push(L.gap());
push(L.h2("3.4 Repository Layout"));
push(L.body(
  "A predictable layout lets a reviewer find code without a tour. Adjust the block below to the actual project and keep it to one screen."
));
push(L.monoBlock([
  "src/",
  "  app/            # pages + route handlers",
  "  components/     # UI components",
  "  lib/            # db client, ai client, validators",
  "  prisma/         # schema + seed",
  "  prompts.md      # AI prompt log (feeds Section 6)",
  "\u3010adjust to the actual project structure\u3011",
]));
push(L.gap());

// ── 4. Execution Timeline ──
push(L.h1("4. Execution Timeline (240 Minutes)"));
push(L.body(
  "The timeline table is written before the timer starts and treated as a contract with yourself. Each block carries a definition of done that can be verified, and a designated cut target: the item to sacrifice first if the block runs long. The non-negotiable rule is that a working end-to-end slice exists by the two-hour mark, because in every timed assessment a complete small thing outscores an incomplete impressive thing."
));
push(L.caption("Table 6. Time-boxed plan with cut priorities"));
push(L.makeTable([14, 24, 38, 24],
  ["Window", "Block", "Definition of done", "Cut first if behind"],
  [
    ["0:00-0:15", "Read brief, fill Sections 1-2, scaffold", "App boots; document skeleton exists", "Nothing — never cut this block"],
    ["0:15-0:40", "Data model and seed data", "Schema pushed; seed script runs", "Seed variety"],
    ["0:40-1:40", "Core API with validation", "All endpoints verified via curl", "Edge-case handling"],
    ["1:40-2:40", "MVP user interface", "Core flow works end to end", "UI polish beyond functional"],
    ["2:40-3:10", "AI feature integration", "One AI flow works with fallback", "Streaming; ship plain JSON"],
    ["3:10-3:35", "Tests and this write-up", "Section 8 checklist passes", "—"],
    ["3:35-4:00", "Buffer, final review, submit", "Package submitted, all sections filled", "—"],
  ]
));
push(L.gap());
push(L.h2("4.1 Progress Log (Actual Versus Planned)"));
push(L.body(
  "Logged live, not reconstructed at the end. A deviation with a stated reason is process evidence that reviewers can score; a silent deviation is just a missed plan. Add a row whenever actual work diverges from Table 6 by more than fifteen minutes."
));
push(L.caption("Table 7. Live deviation log"));
push(L.makeTable([14, 30, 30, 26],
  ["Time", "Intended", "Actual", "Reason for deviation"],
  [
    ["\u3010HH:MM\u3011", "\u3010planned block\u3011", "\u3010what actually happened\u3011", "\u3010why, and what was cut\u3011"],
    ["\u3010HH:MM\u3011", "\u3010planned block\u3011", "\u3010what actually happened\u3011", "\u3010why, and what was cut\u3011"],
    ["\u3010HH:MM\u3011", "\u3010planned block\u3011", "\u3010what actually happened\u3011", "\u3010why, and what was cut\u3011"],
  ]
));
push(L.gap());

// ── 5. Tradeoffs & Scope Decisions ──
push(L.h1("5. Tradeoffs and Scope Decisions"));
push(L.body(
  "Decision-making is scored on visible judgment, not on feature count. A tradeoff table with honest alternatives shows the reviewer how you think about cost, and an explicit not-building list reads as confidence rather than laziness, provided each exclusion carries a reason and a revisit condition. Never present a tradeoff without naming the alternative you rejected; the alternative is what makes it a decision rather than a habit."
));
push(L.h2("5.1 Key Tradeoffs"));
push(L.caption("Table 8. Decisions with rejected alternatives"));
push(L.makeTable([30, 28, 42],
  ["Decision", "Alternative considered", "Rationale"],
  [
    ["SQLite over Postgres", "Postgres + Docker", "Zero setup beats theoretical concurrency for a single-reviewer demo; swap path documented"],
    ["REST route handlers over server actions", "Server actions", "More legible to a reviewer; testable directly with curl"],
    ["One AI feature built deeply", "Three shallow AI touches", "Depth demonstrates integration skill; breadth demonstrates nothing in 40 minutes"],
    ["\u3010decision from your build\u3011", "\u3010alternative\u3011", "\u3010rationale\u3011"],
  ]
));
push(L.gap());
push(L.h2("5.2 Intentionally Not Building"));
push(L.caption("Table 9. Scope exclusions with revisit conditions"));
push(L.makeTable([26, 44, 30],
  ["Excluded", "Why", "Revisit when"],
  [
    ["Authentication and roles", "No brief requirement; consumes 60+ minutes for near-zero score impact", "A multi-user requirement appears"],
    ["CI/CD and containers", "Reviewer runs locally from the README", "The team workflow requires reproducible pipelines"],
    ["Pixel-perfect responsive layouts", "Functional on desktop is the stated bar", "The product ships to end users"],
    ["Real-time collaboration", "Out of scope for a CRUD-shaped brief", "A concrete user story demands it"],
  ]
));
push(L.gap());

// ── 6. AI Leverage Log ──
push(L.h1("6. AI Leverage Log"));
push(L.body(
  "AI leverage is a quarter of the total score and the criterion most candidates leave as an afterthought. The evidence is collected during the build, not written afterwards: a running log of what was asked, what came back, and what was done with it. The log does not need every prompt; it needs the three to five entries that best show decomposition, correction, and judgment, plus one iteration story told end to end. Keep the raw log in a file inside the repository and excerpt the highlights here."
));
push(L.h2("6.1 Prompt Log"));
push(L.caption("Table 10. Prompt log with outcomes"));
push(L.makeTable([6, 22, 46, 26],
  ["#", "Task", "Prompt gist", "Outcome"],
  [
    ["1", "Scaffold and boilerplate", "Generate repo structure and database schema from the data model in Section 3", "Accepted — saved about 30 minutes, verified against plan"],
    ["2", "Edge-case review", "List failure modes of the public API endpoints", "Edited — 4 of 7 suggestions real, rest out of scope"],
    ["3", "Test authoring", "Write happy-path tests for the three core endpoints", "Accepted with fixes — two assertions were wrong"],
    ["4", "\u3010task\u3011", "\u3010prompt gist\u3011", "\u3010Accepted / Edited / Rejected\u3011"],
  ]
));
push(L.gap());
push(L.h2("6.2 Iteration Story"));
push(L.body(
  "\u3010Describe one iteration in full: the initial prompt and a one-line summary of its output, what was wrong or insufficient about that output, the corrected prompt, and the measurable improvement. This single story is what the rubric means by prompting quality and iteration strategy.\u3011"
));
push(L.h2("6.3 Human-in-the-Loop Checkpoints"));
push(L.body(
  "\u3010State where human judgment overrode AI output and why, in one or two sentences per checkpoint. This is what separates operating with AI from delegating to it, and it directly addresses the evaluation criteria for both AI leverage and decision-making.\u3011"
));

// ── 7. Verification & How to Run ──
push(L.h1("7. Verification and How to Run"));
push(L.body(
  "The verification section exists so a reviewer can go from clone to running product in under two minutes without asking questions. Commands must be exact, expected outputs stated, and failures disclosed. Known limitations listed honestly are scored as judgment; limitations discovered by the reviewer are scored against execution quality."
));
push(L.h2("7.1 Quick Start"));
push(L.monoBlock([
  "git clone \u3010repository URL\u3011 && cd \u3010project folder\u3011",
  "npm install",
  "npm run dev        # http://localhost:3000",
  "npm test",
]));
push(L.gap());
push(L.h2("7.2 Test Evidence"));
push(L.caption("Table 11. Verification checks and results"));
push(L.makeTable([20, 28, 34, 18],
  ["Check", "Command or action", "Expected result", "Outcome"],
  [
    ["API happy path", "npm test", "All tests pass", "\u3010Pass / Fail\u3011"],
    ["AI fallback", "Unset API key, restart, exercise AI feature", "Mock response returned, no crash", "\u3010Pass / Fail\u3011"],
    ["Validation", "POST an invalid payload", "400 with field-level error", "\u3010Pass / Fail\u3011"],
    ["Seed integrity", "npm run seed", "\u3010N\u3011 records created", "\u3010Pass / Fail\u3011"],
  ]
));
push(L.gap());
push(L.h2("7.3 Known Limitations and Next Steps"));
push(L.body(
  "\u3010List known limitations and unfinished edges, one or two sentences each. Close with what you would build next with one more hour, in priority order — this converts unfinished work from a weakness into a prioritization signal.\u3011"
));

// ── 8. Appendix: Final Submission Checklist ──
push(L.h1("8. Appendix: Final Submission Checklist"));
push(L.body(
  "Run this checklist in the final fifteen minutes and paste it at the top of the final submission if the portal allows. Every unchecked row is either a five-minute fix or an explicit note in Section 7; do not silently leave rows unchecked, because an honest failed check with a stated reason still earns decision-making credit."
));
push(L.caption("Table 12. Self-check mapped to grading criteria"));
push(L.makeTable([24, 62, 14],
  ["Criterion", "Self-check item", "Done"],
  [
    ["Communication", "Headings are specific, tables carry intro text, no filler text remains", "\u3010Yes / No\u3011"],
    ["Communication", "Total length within five pages; every \u3010placeholder\u3011 replaced", "\u3010Yes / No\u3011"],
    ["Execution quality", "A reviewer can run the project from Section 7 alone", "\u3010Yes / No\u3011"],
    ["Execution quality", "Core flow works end to end on a clean checkout", "\u3010Yes / No\u3011"],
    ["Decision-making", "Every exclusion in Section 5 has a reason and a revisit condition", "\u3010Yes / No\u3011"],
    ["Decision-making", "Deviations in Section 4 are logged with reasons", "\u3010Yes / No\u3011"],
    ["AI leverage", "At least three prompt entries plus one full iteration story", "\u3010Yes / No\u3011"],
    ["AI leverage", "Human-in-the-loop checkpoints stated in Section 6", "\u3010Yes / No\u3011"],
  ]
));

// ═══════════════════════════ DOCUMENT ═══════════════════════════
const doc = new Document({
  creator: "Ajaia Candidate",
  title: "Assessment Submission Template — AI-Native Full Stack Developer",
  styles: {
    default: {
      document: {
        run: { font: L.FONT_BODY, size: 24, color: L.P.body },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: L.FONT_HEAD, size: 32, bold: true, color: L.P.headings },
        paragraph: { spacing: { before: 360, after: 160, line: 312 }, outlineLevel: 0 },
      },
      heading2: {
        run: { font: L.FONT_HEAD, size: 28, bold: true, color: L.P.headings },
        paragraph: { spacing: { before: 240, after: 120, line: 312 }, outlineLevel: 1 },
      },
    },
  },
  sections: [
    { // Section 1: Cover — margin 0, no page numbers, no header/footer
      properties: {
        page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: L.buildCoverR1(coverConfig),
    },
    { // Section 2: Front matter (TOC) — Roman numerals
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } },
      },
      headers: { default: L.pageHeader("Ajaia Technical Assessment — Submission Template") },
      footers: { default: L.pageNumFooter() },
      children: frontMatter,
    },
    { // Section 3: Body — Arabic numerals restarting at 1
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      headers: { default: L.pageHeader("Ajaia Technical Assessment — Submission Template") },
      footers: { default: L.pageNumFooter() },
      children: bodyChildren,
    },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("WROTE", OUT, buf.length, "bytes");
}).catch(err => { console.error(err); process.exit(1); });
