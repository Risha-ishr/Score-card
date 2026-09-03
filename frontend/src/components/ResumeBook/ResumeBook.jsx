import React, { useLayoutEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import './ResumeBook.scss';

const PAGE_HEIGHT = 420;             // must match HTMLFlipBook height
const PAGE_CONTENT_PADDING = 40;     // total top+bottom padding of .book-page-content — match your SCSS
const PAGE_CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_CONTENT_PADDING;
const PAGE_CONTENT_WIDTH = 320 - 40; // match .book-page-content width minus its horizontal padding



/**
 * Renders each section's items off-screen once, measures their real
 * heights, then packs them into pages that fit maxHeight. If a section's
 * content doesn't fit on one page, it spills onto continuation pages.
 */
function useSectionPagination(sections, maxHeight, contentWidth) {
  const [pages, setPages] = useState([]);

  const measureRef = useRef(null);
  const itemRefs = useRef({});
  const titleRefs = useRef({});

  useLayoutEffect(() => {
    if (!measureRef.current) return;

    const newPages = [];

    sections.forEach((section) => {
      if (section.items.length === 0) {
        newPages.push({
          key: `${section.key}-empty`,
          title: section.title,
          isContinuation: false,
          content: section.emptyState,
        });
        return;
      }

      const titleNode = titleRefs.current[section.key];
      const titleHeight = titleNode ? titleNode.getBoundingClientRect().height : 0;

      let currentItems = [];
      let currentHeight = titleHeight;
      let isFirstPage = true;

      const flushPage = () => {
        newPages.push({
          key: `${section.key}-${newPages.length}`,
          title: section.title,
          isContinuation: !isFirstPage,
          content: section.wrap(currentItems),
        });
        currentItems = [];
        currentHeight = titleHeight;
        isFirstPage = false;
      };

      section.items.forEach((item, i) => {
        const node = itemRefs.current[`${section.key}-${i}`];
        const itemHeight = node ? node.getBoundingClientRect().height : 0;

        // If adding this item would overflow the page, close the current
        // page first (unless it's empty — always fit at least one item).
        if (currentItems.length > 0 && currentHeight + itemHeight > maxHeight) {
          flushPage();
        }

        currentItems.push(item.node);
        currentHeight += itemHeight;
      });

      flushPage(); // flush whatever's left
    });

    setPages(newPages);
  }, [sections, maxHeight, contentWidth]);

  // Hidden container — same width/font/padding as a real page, so
  // measured heights match what will actually render.
  const measureNode = (
    <div
      ref={measureRef}
      style={{
        position: 'absolute',
        visibility: 'hidden',
        pointerEvents: 'none',
        top: 0,
        left: -9999,
        width: contentWidth,
      }}
    >
      {sections.map((section) => (
        <div key={section.key}>
          <h4 ref={(el) => (titleRefs.current[section.key] = el)}>{section.title}</h4>
          {section.items.map((item, i) => (
            <div key={i} ref={(el) => (itemRefs.current[`${section.key}-${i}`] = el)}>
              {item.node}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return { pages, measureNode };
}

const ResumeBook = ({ resumeData }) => {
  const [pagesStatus, setPagesStatus] = useState('ready'); // loading - have content loading, ready - have content and pages are ready, no-pages - no content

    const contentRef = React.useRef(null);

  React.useEffect(() => {
    if (contentRef.current) {
      console.log('book-page-content height:', contentRef.current.scrollHeight);
    }
  }, [resumeData]);
  const BookPage = React.forwardRef(({ children }, ref) => (
  <div className="book-page" ref={ref}>
    <div className="book-page-content" ref={contentRef}>
      {children}
    </div>
  </div>
));
  const sections = React.useMemo(() => {
    if (!resumeData) return [];

    return [
      {
        key: 'personal',
        title: 'Personal Details',
        wrap: (nodes) => <>{nodes}</>,
        items: [
          resumeData.name && { node: <p key="name">{resumeData.name}</p> },
          resumeData.email && { node: <p key="email">{resumeData.email}</p> },
          resumeData.phone && { node: <p key="phone">{resumeData.phone}</p> },
          resumeData.summary && { node: <p key="summary" >{resumeData.summary}</p> },
        ].filter(Boolean),
        emptyState: <p className="muted">Personal details will appear here once the resume is parsed.</p>,
      },
      {
        key: 'education',
        title: 'Education',
        wrap: (nodes) => <ul>{nodes}</ul>,
        items: (resumeData.education || []).map((line, i) => ({ node: <li key={i}>{line}</li> })),
        emptyState: <p className="muted">No education details detected in this resume.</p>,
      },
      {
        key: 'matched',
        title: 'Matched Keywords',
        wrap: (nodes) => <div className="skill-tags-wrap">{nodes}</div>,
        items: (resumeData.matched_keywords || []).map((kw, i) => ({
          node: <span key={i} className="skill-tag skill-tag-matched">{kw}</span>,
        })),
        emptyState: <p className="muted">No matched keywords for this resume.</p>,
      },
      {
        key: 'unmatched',
        title: 'Unmatched Keywords',
        wrap: (nodes) => <div className="skill-tags-wrap">{nodes}</div>,
        items: (resumeData.unmatched_keywords || []).map((kw, i) => ({
          node: <span key={i} className="skill-tag">{kw}</span>,
        })),
        emptyState: <p className="muted">No unmatched keywords for this resume.</p>,
      },
    ];
  }, [resumeData]);

  const { pages, measureNode } = useSectionPagination(sections, PAGE_CONTENT_HEIGHT, PAGE_CONTENT_WIDTH);

  return (
    <div className="card form-card">
      <h3 className="card-title">Resume Preview</h3>

      {/* {measureNode}

      <div className="book-wrap">
        {resumeData ? (
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
            {pages.map((page) => (
              <BookPage key={page.key}>
                <h4>{page.title}{page.isContinuation ? ' (cont.)' : ''}</h4>
                {page.content}
              </BookPage>
            ))}
          </HTMLFlipBook>
        ) : (
          <p className="muted">Upload a resume to preview it here.</p>
        )}
      </div> */}
        {
          pagesStatus === 'ready' ? (
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
            {pages.map((page) => (
              <BookPage key={page.key}>
                <h4>{page.title}{page.isContinuation ? ' (cont.)' : ''}</h4>
                <p ref={measureNode}>{page.content} </p>
                
              </BookPage>
            ))}
          </HTMLFlipBook>
          ) : pagesStatus === 'loading' ? (
            <div>Loading…</div>
          ) : pagesStatus === 'no-pages' ? (
            <div>No Content</div>
          ) : (
            <div>Error</div>
          )
        }


    </div>
  );
};

export default ResumeBook;

