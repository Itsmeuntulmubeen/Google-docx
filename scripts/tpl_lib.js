// tpl_lib.js — shared palette, helpers, and R1 cover builder (docx skill compliant)
const {
  Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, TableLayoutType, Header, Footer, PageNumber,
} = require("docx");

// ── Palette: DS-1 Deep Sea (navy + teal) per design-system.md ──
const P = {
  bg: "0B1C2C", accent: "529286",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  table: { headerBg: "529286", headerText: "FFFFFF", accentLine: "529286", innerLine: "BECFCC", surface: "E8ECEB" },
  headings: "0B1C2C", body: "000000", secondary: "5B6B7D", hint: "888888",
};

const FONT_BODY = { ascii: "Times New Roman", eastAsia: "SimSun", hAnsi: "Times New Roman" };
const FONT_HEAD = { ascii: "Times New Roman", eastAsia: "SimHei", hAnsi: "Times New Roman" };
const FONT_MONO = { ascii: "Courier New", eastAsia: "SimSun", hAnsi: "Courier New" };
const FONT_COVER = { ascii: "Arial", eastAsia: "Microsoft YaHei", hAnsi: "Arial" };

const LINE = { line: 312 }; // 1.3x mandatory

// ── Border constants (cover) ──
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ── Safe text guard (common-rules.md) ──
function safeText(value, placeholder) {
  if (value === undefined || value === null || value === "" ||
      String(value) === "NaN" || String(value) === "undefined") {
    return placeholder || "\u3010Please fill in\u3011";
  }
  return String(value);
}

// ── Text / paragraph helpers ──
function run(text, opts = {}) {
  return new TextRun({ text: safeText(text, text), size: 24, color: P.body, font: FONT_BODY, ...opts });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160, ...LINE },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: P.accent, space: 4 } },
    children: [new TextRun({ text, bold: true, size: 32, color: P.headings, font: FONT_HEAD })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120, ...LINE },
    children: [new TextRun({ text, bold: true, size: 28, color: P.headings, font: FONT_HEAD })],
  });
}

// English body: left-aligned, no first-line indent (design-system Typography Rules)
function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 120, ...LINE },
    children: [run(text, opts)],
  });
}

// Paragraph from mixed runs (for bold leads inside a sentence)
function bodyRuns(runs) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 120, ...LINE },
    children: runs,
  });
}

function caption(text) {
  return new Paragraph({
    keepNext: true,
    spacing: { before: 200, after: 80, ...LINE },
    children: [new TextRun({ text, bold: true, size: 21, color: P.headings, font: FONT_BODY })],
  });
}

function cellP(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { ...LINE },
    children: [new TextRun({
      text: safeText(text), size: 21, color: opts.color || P.body,
      bold: !!opts.bold, font: opts.mono ? FONT_MONO : FONT_BODY,
    })],
  });
}

const CELL_MARGINS = { top: 60, bottom: 60, left: 120, right: 120 };

// Horizontal-Only business table (design-system.md Table Style 3)
// header: [string], rows: [[string|{text,mono,bold,color}]]
function makeTable(colPcts, headerCells, dataRows) {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headerCells.map((text, i) => new TableCell({
      children: [cellP(text, { bold: true, color: P.table.headerText })],
      shading: { type: ShadingType.CLEAR, fill: P.table.headerBg },
      margins: CELL_MARGINS,
      width: { size: colPcts[i], type: WidthType.PERCENTAGE },
    })),
  });
  const rows = dataRows.map(cells => new TableRow({
    cantSplit: true,
    children: cells.map((c, i) => {
      const v = typeof c === "object" && c !== null ? c : { text: c };
      return new TableCell({
        children: [cellP(v.text, v)],
        margins: CELL_MARGINS,
        width: { size: colPcts[i], type: WidthType.PERCENTAGE },
      });
    }),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: P.table.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: P.table.accentLine },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: P.table.innerLine },
      insideVertical: NB,
    },
    rows: [headerRow, ...rows],
  });
}

// Accent callout: single-cell table, surface fill + teal left border
function callout(lead, text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: NB, bottom: NB, right: NB,
      left: { style: BorderStyle.SINGLE, size: 16, color: P.accent },
      insideHorizontal: NB, insideVertical: NB,
    },
    rows: [new TableRow({
      cantSplit: true,
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.table.surface },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        width: { size: 100, type: WidthType.PERCENTAGE },
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { ...LINE },
          children: [
            new TextRun({ text: lead + " ", bold: true, size: 21, color: P.headings, font: FONT_BODY }),
            new TextRun({ text, size: 21, color: P.body, font: FONT_BODY }),
          ],
        })],
      })],
    })],
  });
}

// Mono command block: single-cell table, neutral fill, Courier New
function monoBlock(lines) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      cantSplit: true,
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: "F4F6F8" },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        width: { size: 100, type: WidthType.PERCENTAGE },
        children: lines.map(l => new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { ...LINE },
          children: [new TextRun({ text: safeText(l), size: 20, color: "1A2B40", font: FONT_MONO })],
        })),
      })],
    })],
  });
}

// Spacer paragraph after tables (keeps adjacent tables from touching)
function gap(before = 160) {
  return new Paragraph({ spacing: { before, ...LINE }, children: [] });
}

// ── Cover title layout (width-aware for Latin text, per design-system estimateTextWidth) ──
function estimateTextWidth(text, pt) {
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    const isCJK = (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF) ||
      (code >= 0x3000 && code <= 0x303F) || (code >= 0xFF00 && code <= 0xFFEF) ||
      (code >= 0x2E80 && code <= 0x2EFF);
    width += isCJK ? pt * 20 : pt * 11;
  }
  return width;
}

function splitWordsToLines(title, maxWidthTwips, pt) {
  const words = title.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const cand = cur ? cur + " " + w : w;
    if (estimateTextWidth(cand, pt) <= maxWidthTwips || !cur) cur = cand;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  // orphan prevention: merge a very short last line into the previous one
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += " " + last;
  }
  return lines;
}

function calcTitleLayoutMixed(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  let titlePt = preferredPt, lines;
  while (titlePt >= minPt) {
    lines = splitWordsToLines(title, maxWidthTwips, titlePt);
    const fits = lines.every(l => estimateTextWidth(l, titlePt) <= maxWidthTwips);
    if (fits && lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) { lines = splitWordsToLines(title, maxWidthTwips, minPt); titlePt = minPt; }
  return { titlePt, titleLines: lines };
}

// ── calcCoverSpacing (design-system.md, verbatim logic) ──
function calcCoverSpacing(params) {
  const {
    titleLineCount = 1, titlePt = 36, hasSubtitle = false,
    hasEnglishLabel = false, metaLineCount = 0,
    fixedHeight = 800, pageHeight = 16838,
    marginTop = 0, marginBottom = 0,
  } = params;
  const SAFETY = 1200;
  const usableHeight = pageHeight - marginTop - marginBottom - SAFETY;
  const titleHeight = titleLineCount * (titlePt * 23 + 200);
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0;
  const englishLabelHeight = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaHeight = metaLineCount * (10 * 23 + 100);
  const implicitParaHeight = 3 * 300;
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight +
                        metaHeight + fixedHeight + implicitParaHeight;
  const remainingSpace = usableHeight - contentHeight;
  const safeRemaining = Math.max(remainingSpace, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(safeRemaining * 0.45);
  const rawBottom = Math.floor(safeRemaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  const midSpacing = Math.max(safeRemaining - topSpacing - bottomSpacing, 0);
  return { topSpacing, midSpacing, bottomSpacing };
}

// ── Recipe R1: Pure Paragraph Cover, left-aligned (design-system.md) ──
function buildCoverR1(config) {
  const C = config.palette;
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayoutMixed(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length,
    fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: C.accent, space: 12 };
  const children = [];

  // 1. Top whitespace (dynamic)
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));

  // 2. English label with accent bottom border
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500, ...LINE },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent, space: 8 } },
      children: [new TextRun({ text: config.englishLabel.split("").join("  "),
        size: 18, color: C.accent, font: { ascii: "Calibri", eastAsia: "SimHei", hAnsi: "Calibri" }, characterSpacing: 40 })],
    }));
  }

  // 3. Main title (dynamic size + word-boundary line breaks)
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true,
        color: C.titleColor, font: FONT_COVER })],
    }));
  }

  // 4. Subtitle
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL }, spacing: { after: 800, ...LINE },
      children: [new TextRun({ text: config.subtitle, size: 24, color: C.subtitleColor, font: FONT_COVER })],
    }));
  }

  // 5. Meta lines with left accent border
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80, ...LINE },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: C.metaColor, font: FONT_COVER })],
    }));
  }

  // 6. Bottom whitespace (dynamic)
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));

  // 7. Footer with top accent separator
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: C.accent, space: 8 } },
    spacing: { before: 200, ...LINE },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: C.footerColor, font: { ascii: "Arial", hAnsi: "Arial" } }),
      new TextRun({ text: "                                        ", size: 16, font: { ascii: "Arial", hAnsi: "Arial" } }),
      new TextRun({ text: config.footerRight || "", size: 16, color: C.footerColor, font: { ascii: "Arial", hAnsi: "Arial" } }),
    ],
  }));

  // Single 16838 wrapper — the ONLY table, exact height, allNoBorders
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: C.bg }, borders: noBorders,
        children,
      })],
    })],
  })];
}

// ── Page header / footer builders ──
function pageHeader(title) {
  return new Header({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0, ...LINE },
      children: [new TextRun({ text: title, size: 18, color: "808080", font: FONT_BODY })],
    })],
  });
}

function pageNumFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { ...LINE },
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: FONT_BODY })],
    })],
  });
}

module.exports = {
  P, FONT_BODY, FONT_HEAD, FONT_MONO, FONT_COVER, LINE, NB, noBorders, allNoBorders,
  safeText, run, h1, h2, body, bodyRuns, caption, cellP, makeTable, callout, monoBlock, gap,
  estimateTextWidth, calcTitleLayoutMixed, calcCoverSpacing, buildCoverR1, pageHeader, pageNumFooter,
};
