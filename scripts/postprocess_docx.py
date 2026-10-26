#!/usr/bin/env python3
"""postprocess_docx.py — WPS/Word compatibility post-pass (per docx skill toc.md):
1. Remove empty <w:pgNumType/> emitted by docx-js (confuses WPS).
2. Patch footer PAGE fields with explicit format switches, mapped per section:
   upperRoman section footer -> PAGE \\* ROMAN \\* MERGEFORMAT
   decimal section footer    -> PAGE \\* arabic \\* MERGEFORMAT
"""
import re
import shutil
import sys
import zipfile

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def main(path: str) -> int:
    with zipfile.ZipFile(path, "r") as z:
        names = z.namelist()
        files = {n: z.read(n) for n in names}

    doc = files["word/document.xml"].decode("utf-8")
    rels = files["word/_rels/document.xml.rels"].decode("utf-8")

    # 1. Remove empty pgNumType elements
    removed = doc.count("<w:pgNumType/>")
    doc = doc.replace("<w:pgNumType/>", "")

    # Map rId -> footer target file
    rel_map = dict(re.findall(r'<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"', rels))

    # For each sectPr: find its pgNumType fmt and its default footerReference rId
    patched = []
    for sect in re.findall(r"<w:sectPr[^>]*>.*?</w:sectPr>", doc, flags=re.S):
        fmt_m = re.search(r'<w:pgNumType[^>]*w:fmt="([^"]+)"', sect)
        foot_m = re.search(r'<w:footerReference[^>]*w:type="default"[^>]*r:id="([^"]+)"', sect)
        if not (fmt_m and foot_m):
            continue
        fmt = fmt_m.group(1)
        target = rel_map.get(foot_m.group(1), "")
        fname = "word/" + target.lstrip("/")
        if fname not in files:
            continue
        if fmt == "upperRoman":
            switch = r" PAGE \\* ROMAN \\* MERGEFORMAT "
        elif fmt in ("decimal", "arabic"):
            switch = r" PAGE \\* arabic \\* MERGEFORMAT "
        else:
            continue
        fx = files[fname].decode("utf-8")
        new_fx, n = re.subn(
            r"(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)",
            lambda m: m.group(1) + switch.replace("\\\\", "\\") + m.group(2),
            fx,
        )
        if n:
            files[fname] = new_fx.encode("utf-8")
            patched.append((fname, fmt, n))

    files["word/document.xml"] = doc.encode("utf-8")

    tmp = path + ".tmp"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
        for n in names:
            z.writestr(n, files[n])
    shutil.move(tmp, path)

    print(f"pgNumType removed: {removed}; footers patched: {patched}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
