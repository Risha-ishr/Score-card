import io
import re

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"(?:\+?\d{1,3}[\s\-.]?)?(?:\(?\d{2,4}\)?[\s\-.]?)?\d{3,4}[\s\-.]?\d{3,4}")

# Some PDFs embed fonts without a ToUnicode map; pdfplumber then falls back to
# emitting the raw glyph id as literal "(cid:N)" text instead of a character
# (most often where the source PDF used a custom bullet/symbol glyph).
CID_ARTIFACT_RE = re.compile(r"\(cid:\d+\)")

SECTION_HEADINGS = {
    "education":  ["education", "academic background", "academics", "qualification"],
    "experience": ["experience", "work experience", "employment history", "professional experience", "work history"],
    "skills":     ["skills", "technical skills", "core competencies", "key skills"],
    "summary":    ["summary", "objective", "profile", "about me"],
    "projects":   ["projects", "personal projects"],
    "certifications": ["certifications", "certificates", "licenses"],
}

def extract_text(content: bytes, filename: str) -> str:
    ext = (filename.rsplit(".", 1)[-1] if "." in filename else "").lower()

    if ext == "pdf":
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text() or "")
        text = "\n".join(text_parts)
        text = CID_ARTIFACT_RE.sub("", text)
        return text

    if ext == "docx":
        import docx
        doc = docx.Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)

    raise ValueError("Unsupported file type — please upload a PDF or DOCX resume.")


def _find_heading(line: str):
    stripped = line.strip().strip(":").lower()
    if not stripped or len(stripped) > 40:
        return None
    for section, aliases in SECTION_HEADINGS.items():
        if stripped in aliases:
            return section
    return None


def _split_sections(lines):
    sections = {key: [] for key in SECTION_HEADINGS}
    current = None
    for line in lines:
        heading = _find_heading(line)
        if heading:
            current = heading
            continue
        if current and line.strip():
            sections[current].append(line.strip())
    return sections


def _guess_name(lines, email):
    for line in lines[:10]:
        candidate = line.strip()
        if not candidate:
            continue
        if EMAIL_RE.search(candidate) or PHONE_RE.search(candidate):
            continue
        words = candidate.split()
        if 1 < len(words) <= 4 and all(w[0].isupper() for w in words if w[0].isalpha()):
            if not any(ch.isdigit() for ch in candidate):
                return candidate
    return None


def match_keywords(text: str, keywords):
    lower_text = text.lower()
    matched, unmatched = [], []
    for kw in (keywords or []):
        kw = kw.strip()
        if not kw:
            continue
        pattern = r"(?<![a-z0-9+#.])" + re.escape(kw.lower()) + r"(?![a-z0-9+#])"
        (matched if re.search(pattern, lower_text) else unmatched).append(kw)
    return matched, unmatched


def _guess_skills(skills_section_lines, matched_keywords):
    found = set(matched_keywords)

    for line in skills_section_lines:
        for token in re.split(r"[,|••/]", line):
            token = token.strip(" -\t")
            if 1 < len(token) <= 30:
                found.add(token.lower())

    return sorted(found)


def parse_resume(text: str, keywords=None) -> dict:
    lines = [l for l in text.splitlines()]
    non_empty = [l for l in lines if l.strip()]

    email_match = EMAIL_RE.search(text)
    email = email_match.group(0) if email_match else None

    phone_match = PHONE_RE.search(text)
    phone = phone_match.group(0).strip() if phone_match else None

    name = _guess_name(non_empty, email)
    sections = _split_sections(lines)
    matched_keywords, unmatched_keywords = match_keywords(text, keywords)
    skills = _guess_skills(sections["skills"], matched_keywords)

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "matched_keywords": matched_keywords,
        "unmatched_keywords": unmatched_keywords,
        "education": sections["education"],
        "experience": sections["experience"],
        "summary": " ".join(sections["summary"]) or None,
        "projects": sections["projects"],
        "certifications": sections["certifications"],
    }
