#!/usr/bin/env python3
"""dedupe_toc_first_entry.py — remove the redundant TOC entry that docx-js
emits inside the field-start paragraph (hyperlink + dirty PAGEREF for _Toc1).
The add_toc_placeholders.py script injects its own full entry list, so the
first heading otherwise appears twice. The field runs (begin + instrText +
separate) are preserved by splicing them into the first injected entry
paragraph, keeping the TOC field valid for Word's "Update Field".
"""
import re
import shutil
import sys
import zipfile


def main(path: str) -> int:
    with zipfile.ZipFile(path, "r") as z:
        names = z.namelist()
        files = {n: z.read(n) for n in names}

    xml = files["word/document.xml"].decode("utf-8")

    # Locate the TOC field's begin fldChar (the instrText containing 'TOC ')
    instr_m = re.search(r'<w:instrText[^>]*>[^<]*TOC\s[^<]*</w:instrText>', xml)
    if not instr_m:
        print("No TOC field found; nothing to do")
        return 0

    # Field-start paragraph: nearest <w:p ...> before the instr, ending </w:p>
    p_start = xml.rfind("<w:p>", 0, instr_m.start())
    p_start_alt = xml.rfind("<w:p ", 0, instr_m.start())
    p_start = max(p_start, p_start_alt)
    p_end = xml.index("</w:p>", instr_m.end()) + len("</w:p>")
    para = xml[p_start:p_end]

    if "<w:hyperlink" not in para:
        print("Field-start paragraph has no hyperlink entry; nothing to do")
        return 0

    # Runs to preserve: from first <w:r> containing the begin fldChar
    # through the run that closes after the separate fldChar
    begin_r = para.index("<w:r>")
    sep_m = re.search(r'<w:fldChar w:fldCharType="separate"/>', para)
    sep_r_end = para.index("</w:r>", sep_m.end()) + len("</w:r>")
    field_runs = para[begin_r:sep_r_end]

    # Sanity: field runs must not contain the hyperlink
    assert "<w:hyperlink" not in field_runs, "hyperlink inside field runs?"

    # Next paragraph = first injected TOC entry
    next_p_start = xml.index("<w:p", p_end)
    next_ppr_end = xml.index("</w:pPr>", next_p_start) + len("</w:pPr>")

    # Remove field-start paragraph; splice field runs after next paragraph's pPr
    new_xml = xml[:p_start] + xml[p_end:next_ppr_end] + field_runs + xml[next_ppr_end:]

    # Validations — the removed span deletes exactly one dirty PAGEREF field
    # (begin+separate+end) inside the hyperlink, nothing else:
    for token, delta in [("<w:hyperlink", 1), ('fldCharType="begin"', 1),
                         ('fldCharType="separate"', 1), ('fldCharType="end"', 1)]:
        lost = xml.count(token) - new_xml.count(token)
        assert lost == delta, f"{token}: expected to lose {delta}, lost {lost}"
    assert new_xml.count("TOC \\") == xml.count("TOC \\"), "TOC instrText lost"

    files["word/document.xml"] = new_xml.encode("utf-8")

    tmp = path + ".tmp"
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
        for n in names:
            z.writestr(n, files[n])
    shutil.move(tmp, path)
    print("Removed duplicate first TOC entry; field runs spliced into first entry paragraph")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
