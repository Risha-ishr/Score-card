import React from 'react';
import './Timeline.scss';
import { useState } from 'react';


const SAMPLE = [
  { label: 'Added',      pos: 0,    type: 'start'  },
  { label: 'Screened',   pos: 0.22, type: 'score'  },
  { label: 'Scored',     pos: 0.45, type: 'score'  },
  { label: 'Re-scored',  pos: 0.68, type: 'update' },
  { label: 'Updated',    pos: 0.86, type: 'update' },
  { label: 'Now',        pos: 1,    type: 'end'    },
];

export default function Timeline({ milestones }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div className="tl">
      <div className="tl-track">
        <div />
        {milestones.map((m, i) => (
          <>
          <div
            key={i}
            className={`tl-node tl-${m.type}`}
            style={{ left: `${m.pos * 100}%` }}
            title={m.label}
            
          >
          </div>
           {/* <div className="tl-connector" /> */}
           {milestones[i + 1] && (
      <div
        className="tl-connector"
        style={{
          left: `${(m.pos * 100) + 3}%`,
          width: `${(milestones[i + 1].pos - m.pos) * 100}%`,
        }}
      />
    )}
          </>
        ))}
      </div>
      
      
      <div className="tl-labels">
        {/* <span className="tl-label tl-label-start">{milestones[0]?.label}</span> */}
        {/* <span className="tl-label tl-label-end">{milestones[milestones.length - 1]?.label}</span> */}
      </div>
    </div>
  );
}
