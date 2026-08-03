import io
import re

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"(?:\+?\d{1,3}[\s\-.]?)?(?:\(?\d{2,4}\)?[\s\-.]?)?\d{3,4}[\s\-.]?\d{3,4}")

SECTION_HEADINGS = {
    "education":  ["education", "academic background", "academics", "qualification"],
    "experience": ["experience", "work experience", "employment history", "professional experience", "work history"],
    "skills":     ["skills", "technical skills", "core competencies", "key skills"],
    "summary":    ["summary", "objective", "profile", "about me"],
    "projects":   ["projects", "personal projects"],
    "certifications": ["certifications", "certificates", "licenses"],
}

SKILL_KEYWORDS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "golang", "rust", "php", "ruby",
    "react", "react native", "angular", "vue", "next.js", "node.js", "node", "express", "django", "flask",
    "fastapi", "spring", "spring boot", ".net", "html", "css", "sass", "tailwind", "bootstrap",
    "sql", "postgresql", "mysql", "mongodb", "redis", "sqlite", "oracle", "nosql",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins", "ci/cd", "git", "github", "gitlab",
    "linux", "bash", "powershell", "rest api", "graphql", "microservices", "kafka", "rabbitmq",
    "machine learning", "deep learning", "nlp", "data science", "pandas", "numpy", "tensorflow", "pytorch",
    "scikit-learn", "excel", "power bi", "tableau", "figma", "photoshop",
    "agile", "scrum", "jira", "communication", "leadership", "teamwork", "problem solving",
    "project management", "time management", "recruitment", "talent acquisition", "sourcing",
    "stakeholder management", "customer service", "sales", "negotiation",
]


def extract_text(content: bytes, filename: str) -> str:
    ext = (filename.rsplit(".", 1)[-1] if "." in filename else "").lower()

    if ext == "pdf":
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text() or "")
        return "\n".join(text_parts)

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


def _guess_skills(text: str, skills_section_lines):
    found = set()
    lower_text = text.lower()
    for kw in SKILL_KEYWORDS:
        pattern = r"(?<![a-z0-9+#.])" + re.escape(kw) + r"(?![a-z0-9+#])"
        if re.search(pattern, lower_text):
            found.add(kw)

    for line in skills_section_lines:
        for token in re.split(r"[,|••/]", line):
            token = token.strip(" -\t")
            if 1 < len(token) <= 30:
                found.add(token.lower())

    return sorted(found)


def parse_resume(text: str) -> dict:
    lines = [l for l in text.splitlines()]
    non_empty = [l for l in lines if l.strip()]

    email_match = EMAIL_RE.search(text)
    email = email_match.group(0) if email_match else None

    phone_match = PHONE_RE.search(text)
    phone = phone_match.group(0).strip() if phone_match else None

    name = _guess_name(non_empty, email)
    sections = _split_sections(lines)
    skills = _guess_skills(text, sections["skills"])

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "education": sections["education"],
        "experience": sections["experience"],
        "summary": " ".join(sections["summary"]) or None,
        "projects": sections["projects"],
        "certifications": sections["certifications"],
    }
