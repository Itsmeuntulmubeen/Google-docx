# Worklog

---
Task ID: 1
Agent: main (Z.ai)
Task: Create a Google-Docs-compatible .docx submission template for the Ajaia "AI-Native Full Stack Developer" 240-minute take-home assessment (user selections: submission template content, business-accent style, cover + TOC).

Work Log:
- Loaded docx skill chain: SKILL.md, routes/create.md, references/docx-js-core.md, references/design-system.md (full), references/common-rules.md, references/toc.md, scenes/report.md
- Clarified requirements via AskUserQuestion: content=Submission template, style=Business accent, structure=Cover+TOC
- Inspected postcheck.py to learn exact validations (blank pages, line spacing uniformity incl. table cells, font whitelist, heading continuity, TOC field, cover overflow)
- Built cover per validated Recipe R1 + DS-1 palette (navy 0B1C2C / teal 529286), with width-aware calcTitleLayoutMixed for Latin titles and calcCoverSpacing
- 3-section architecture: cover (margin 0, no page numbers) / TOC (Roman I) / body (Arabic restarting at 1); horizontal-only business tables (teal headers, tableHeader+cantSplit+keepNext, PERCENTAGE widths, CLEAR shading); accent callouts; mono blocks
- Wrote scripts/tpl_lib.js, scripts/generate_submission_template.js, scripts/postprocess_docx.py (empty pgNumType removal + footer PAGE \* ROMAN / \* arabic switches mapped per section), scripts/dedupe_toc_first_entry.py, scripts/build.sh
- Diagnosed and fixed duplicate first TOC entry: docx-js TableOfContents pre-emits a hyperlink entry for heading 1 inside the field-start paragraph; add_toc_placeholders.py injects its own 23 entries -> first heading appears twice. Dedupe script splices field begin/instr/separate runs into the first injected entry paragraph and drops the redundant hyperlink (dirty PAGEREF), preserving Word "Update Field" behavior
- Pipeline: build.sh runs generate -> postprocess -> add_toc_placeholders --auto -> dedupe -> postcheck
- Verified via LibreOffice PDF render: cover, TOC (23 entries, Roman footer), body pages with tables/callouts/mono blocks all correct; 11 pages total

Stage Summary:
- Deliverable: /home/z/my-project/download/Ajaia-Assessment-Submission-Template.docx (passes postcheck 9/9, 0 errors, 0 warnings)
- 8 body sections mapped to the 4 grading criteria, 12 tables, 【】 placeholders per skill convention
- Rebuild anytime with: bash /home/z/my-project/scripts/build.sh

---
Task ID: 2
Agent: main (Z.ai)
Task: Build a Google Docs clone ("google docx clone banana hai") as a working Next.js web app — Type 3 fullstack development.

Work Log:
- Initialized fullstack env via init script; inspected scaffold (Next.js 16 App Router, Prisma/SQLite, shadcn/ui, z-ai-web-dev-sdk)
- Prisma schema: Document (title, content JSON) + AiInteraction (documentId, action, inputText, result) as AI audit trail; db:push done
- API routes: GET/POST /api/documents, GET/PATCH/DELETE /api/documents/[id] (zod-validated, Next 16 async params), POST /api/ai (server-side ZAI SDK, 4 actions: continue/improve/summarize/title, fences stripped, result logged to AiInteraction)
- Installed Tiptap 3.32; fixed v3 breaking change: TextStyle/Color/FontFamily are NAMED exports of @tiptap/extension-text-style (no default export)
- Home view (single-page state routing, only / route): Docs logo, pill search, template gallery (blank/notes/proposal/resume/letter with pre-filled content), recent list with relativeTime, kebab menu (open/rename dialog/delete AlertDialog)
- Editor view: Docs-style header (logo back, editable title, star, save status), functional File/Edit/Insert/Format menubar, toolbar (undo/redo, style+font Selects, B/I/U/S, color+highlight popovers, link popover with empty-selection insert, align, 3 list types incl. checklist, clear formatting) using useEditorState; A4-like white page (816px, 11.76% padding) with Docs typography CSS in globals.css
- Autosave: 900ms debounce, dirty-ref flush, visibilitychange keepalive flush, save-before-back, status states saved/saving/error with retry; word-count chip
- AI side panel (Gemini-style): action chips, context label (selection vs whole doc), loading/result/error states, Insert-at-cursor (replaces selection), Append with "- " → bulletList conversion, Apply-as-title, Copy, Regenerate
- page.tsx shell: view state home|editor keyed remount, documents cache with upsertMeta on autosave
- Fixed lint (react-hooks/set-state-in-effect): inlined async IIFE fetch in page.tsx effect, removed sync setStatus in editor effect; ignored scripts/ in eslint config
- E2E verified with Agent Browser: create from template, typing + autosave persisted (API confirmed), Suggest title applied, Continue writing inserted matching content, search filter, delete flow, mobile 390px viewport, zero console/page errors
- Seeded "Welcome to Docs ✨" demo document via API for first-run showcase

Stage Summary:
- Deliverable: runnable Google Docs clone at / (Next.js 16 + Tiptap 3 + Prisma/SQLite + z-ai-web-dev-sdk)
- All CRUD + AI endpoints smoke-tested 200/201; lint clean; dev.log clean post-fix
- AI leverage evidence: every AI call persisted in AiInteraction table
