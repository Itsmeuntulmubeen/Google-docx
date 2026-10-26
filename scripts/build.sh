#!/usr/bin/env bash
# build.sh — full reproducible pipeline for the Ajaia submission template docx
set -euo pipefail
cd /home/z/my-project

OUT=download/Ajaia-Assessment-Submission-Template.docx
SKILL=skills/docx/scripts

echo "[1/5] generate docx (docx-js)"
node scripts/generate_submission_template.js

echo "[2/5] post-process: pgNumType cleanup + footer PAGE format switches"
python3 scripts/postprocess_docx.py "$OUT"

echo "[3/5] inject TOC placeholder entries + updateFields + outlineLvl"
python3 "$SKILL/add_toc_placeholders.py" "$OUT" --auto

echo "[4/5] dedupe docx-js first TOC entry"
python3 scripts/dedupe_toc_first_entry.py "$OUT"

echo "[5/5] postcheck"
python3 "$SKILL/postcheck.py" "$OUT"
