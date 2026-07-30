import React from 'react';
import './Timeline.scss';
import { useState } from 'react';

/**
 * Scorecard activity timeline bar — modelled on the profile timeline in the design.
 * Shows the life of a scorecard: when the candidate was added, screened, scored,
 * re-scored, and last updated.
 *
 * NOTE: this is a STATIC placeholder. The milestones below are hard-coded so the
 * UI can be reviewed before the backend is ready. When the backend can return a
 * real activity trail, pass it in via the `milestones` prop (same shape as SAMPLE)
 * and this component renders it as-is — no other change needed.
 *
 * milestone: { label: string, pos: 0..1, type: 'start'|'score'|'update'|'end' }
 *   label → the text shown on hover (e.g. a date or event name)
 *   pos   → horizontal position along the track (0 = far left, 1 = far right)
 *   type  → controls the marker icon/style
 */
const SAMPLE = [
  { label: 'Added',      pos: 0,    type: 'start'  },
  { label: 'Screened',   pos: 0.22, type: 'score'  },
  { label: 'Scored',     pos: 0.45, type: 'score'  },
  { label: 'Re-scored',  pos: 0.68, type: 'update' },
  { label: 'Updated',    pos: 0.86, type: 'update' },
  { label: 'Now',        pos: 1,    type: 'end'    },
];

export default function Timeline({ milestones = SAMPLE }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div className="tl">
      <div className="tl-track">
        <div className="tl-line" />
        {milestones.map((m, i) => (
          <div
            key={i}
            className={`tl-node tl-${m.type}`}
            style={{ left: `${m.pos * 100}%` }}
            title={m.label}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
          {hovered === i && (
            // <div className="tl-tooltip">
            //   <div className="tl-tooltip-label">{m.label}</div>
            //   <div className="tl-tooltip-date">{m.date}</div>
            // </div>
            <div style={{ display: 'flex', backgroundColor: '#f0f0f0', border: '1px solid #0d0b0b', justifyContent: 'space-between', marginTop: '4px' }}></div>
          )}
          </div>
        ))}
      </div>
      
      
      <div className="tl-labels">
        {/* <span className="tl-label tl-label-start">{milestones[0]?.label}</span> */}
        {/* <span className="tl-label tl-label-end">{milestones[milestones.length - 1]?.label}</span> */}
      </div>
    </div>
  );
}
