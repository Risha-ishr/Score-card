import React, { useState, useRef, useLayoutEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';

const PAGE_HEIGHT = 300;
// Reserve space for heading/padding inside .page-content
const CONTENT_MAX_HEIGHT = PAGE_HEIGHT - 10;

// Splits `text` into chunks that fit within `maxHeight` (px),
// preserving the original string exactly (no whitespace collapsing).
function splitTextToFitHeight(text, measureEl, maxHeight) {
  const boundaries = [];
  const regex = /\S+\s*/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    boundaries.push(match.index + match[0].length);
  }

  const pages = [];
  let pageStart = 0;

  for (let i = 0; i < boundaries.length; i++) {
    const end = boundaries[i];
    measureEl.textContent = text.slice(pageStart, end);

    if (measureEl.scrollHeight > maxHeight) {
      const prevEnd = i > 0 ? boundaries[i - 1] : end;
      if (prevEnd === pageStart) {
        // Single word already overflows on its own — force it in anyway
        pages.push(text.slice(pageStart, end));
        pageStart = end;
      } else {
        pages.push(text.slice(pageStart, prevEnd));
        pageStart = prevEnd;
      }
    }
  }

  if (pageStart < text.length) {
    pages.push(text.slice(pageStart));
  }

  return pages.length > 0 ? pages : [text];
}

// name, email, phone, and summary make up Personal Details
function buildPersonalDetailsText(data) {
  const { name, email, phone, summary } = data;
  const lines = [];
  if (name) lines.push(name);
  if (email) lines.push(`Email: ${email}`);
  if (phone) lines.push(`Phone: ${phone}`);
  if (summary) lines.push(`\n${summary}`);
  return lines.join('\n');
}

// education is an array like [degree, dateRange, degree2, dateRange2, ...]
function buildEducationText(data) {
  if (!Array.isArray(data.education) || data.education.length === 0) return '';
  return data.education.join('\n');
}

// job titles from the `experience` array
function buildWorkExperienceText(data) {
  if (!Array.isArray(data.experience) || data.experience.length === 0) return '';
  return data.experience.join('\n');
}

// comma-separated skills list
function buildMatchedSkillsText(data) {
  const skills = Array.isArray(data.skills) ? data.skills : [];
  return skills.join(', ');
}

const BookPage = React.forwardRef(({ children }, ref) => (
  <div className="book-page" ref={ref}>
    <div className="book-page-content">{children}</div>
  </div>
));

const ResumeBook1 = ({ resumeData }) => {
  // loading - content loading, success - content ready, no-pages - no content, error - failed
  const [pagesStatus, setPagesStatus] = useState('loading');
  const [pagesTypes, setPagesTypes] = useState({
    personalDetails: 1,
    education: 1,
    matchedSkills: 1,
    workExperience: 1,
  });

  const [personalDetailsPages, setPersonalDetailsPages] = useState([]);
  const [educationPages, setEducationPages] = useState([]);
  const [workExperiencePages, setWorkExperiencePages] = useState([]);
  const [matchedSkillsPages, setMatchedSkillsPages] = useState([]);

  const measureRef = useRef(null);

  useLayoutEffect(() => {
    console.log('ResumeBook1 useLayoutEffect called', resumeData);

    if (!resumeData) {
      setPagesStatus('no-pages');
      return;
    }
    if (!measureRef.current) return;

    const personalDetailsText = buildPersonalDetailsText(resumeData);
    const educationText = buildEducationText(resumeData);
    const workExperienceText = buildWorkExperienceText(resumeData);
    const matchedSkillsText = buildMatchedSkillsText(resumeData);

    const hasAnyContent =
      personalDetailsText || educationText || workExperienceText || matchedSkillsText;

    if (!hasAnyContent) {
      setPagesStatus('no-pages');
      return;
    }

    try {
      const pd = personalDetailsText
        ? splitTextToFitHeight(personalDetailsText, measureRef.current, CONTENT_MAX_HEIGHT)
        : [];
      const edu = educationText
        ? splitTextToFitHeight(educationText, measureRef.current, CONTENT_MAX_HEIGHT)
        : [];
      const work = workExperienceText
        ? splitTextToFitHeight(workExperienceText, measureRef.current, CONTENT_MAX_HEIGHT)
        : [];
      const skills = matchedSkillsText
        ? splitTextToFitHeight(matchedSkillsText, measureRef.current, CONTENT_MAX_HEIGHT)
        : [];

      console.log('personalDetailsPages:', pd);
      console.log('educationPages:', edu);
      console.log('workExperiencePages:', work);
      console.log('matchedSkillsPages:', skills);

      setPersonalDetailsPages(pd);
      setEducationPages(edu);
      setWorkExperiencePages(work);
      setMatchedSkillsPages(skills);

      setPagesTypes({
        personalDetails: Math.max(pd.length, 1),
        education: Math.max(edu.length, 1),
        workExperience: Math.max(work.length, 1),
        matchedSkills: Math.max(skills.length, 1),
      });

      setPagesStatus('success');
    } catch (err) {
      console.error('Pagination failed:', err);
      setPagesStatus('error');
    }
  }, [resumeData]);

  return (
    <div style={{ marginBottom: '20px'}}>
      {/* Hidden measuring element — must match .page-content styles exactly */}
      <div
        ref={measureRef}
        className="page-content"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          top: -9999,
          left: -9999,
          width: 320,
          height: 'auto',
          whiteSpace: 'pre-wrap',
        }}
      />

      {pagesStatus === 'success' ? (
        <HTMLFlipBook
          width={320}
          height={PAGE_HEIGHT}
          size="stretch"
          minWidth={260}
          maxWidth={420}
          minHeight={340}
          maxHeight={560}
          showCover={false}
          className="resume-book"
        >
          {/* Personal Details Pages */}
          {personalDetailsPages.map((chunk, index) => (
            <BookPage key={`personal-${index}`}>
              <div className="page-content">
                {index === 0 && <h4>Personal Details</h4>}
                <p style={{ whiteSpace: 'pre-wrap' }}>{chunk}</p>
              </div>
            </BookPage>
          ))}

          {/* Education Pages */}
          {educationPages.map((chunk, index) => (
            <BookPage key={`edu-${index}`}>
              <div className="page-content">
                {index === 0 && <h4>Education</h4>}
                <p style={{ whiteSpace: 'pre-wrap' }}>{chunk}</p>
              </div>
            </BookPage>
          ))}

          {/* Work Experience Pages */}
          {workExperiencePages.map((chunk, index) => (
            <BookPage key={`work-${index}`}>
              <div className="page-content">
                {index === 0 && <h4>Work Experience</h4>}
                <p style={{ whiteSpace: 'pre-wrap' }}>{chunk}</p>
              </div>
            </BookPage>
          ))}

          {/* Matched Skills Pages */}
          {matchedSkillsPages.map((chunk, index) => (
            <BookPage key={`skills-${index}`}>
              <div className="page-content">
                {index === 0 && <h4>Skills</h4>}
                <p style={{ whiteSpace: 'pre-wrap' }}>{chunk}</p>
              </div>
            </BookPage>
          ))}
        </HTMLFlipBook>
      ) : pagesStatus === 'loading' ? (
        <div>Loading…</div>
      ) : pagesStatus === 'no-pages' ? (
        <div>No Content</div>
      ) : (
        <div>Error</div>
      )}
    </div>
  );
};

export default ResumeBook1;