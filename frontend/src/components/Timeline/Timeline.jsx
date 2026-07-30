import React from 'react';
import './Timeline.scss';
import { useState } from 'react';
import dayjs from 'dayjs';

const POPUP_ROW_SIZE = 7;
const posInRow = (i, len) => (len === 1 ? 0 : i / (len - 1));

export default function Timeline({ milestones }) {
  const [hovered, setHovered] = useState(false);

  const visibleMilestones =
    milestones.length <= 5
      ? milestones
      : (() => {
          const step = (milestones.length - 1) / 4; // 5 points: first, 3 middle, last
          return Array.from({ length: 5 }, (_, i) =>
            milestones[Math.round(i * step)]
          );
        })();

  const popupRows = [];
  for (let i = 0; i < milestones.length; i += POPUP_ROW_SIZE) {
    popupRows.push(milestones.slice(i, i + POPUP_ROW_SIZE));
  }

  return (
    <div
      className="tl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="tl-track">
        <div />
        {visibleMilestones.map((m, i) => (
          <React.Fragment key={i}>
            <div
              className={`tl-node tl-${m.type}`}
              style={{ left: `${m.pos * 100}%` }}
              title={m.label}
            >
            </div>
             {visibleMilestones[i + 1] && (
      <div
        className="tl-connector"
        style={{
          left: `${(m.pos * 100) + 3}%`,
          width: `${(visibleMilestones[i + 1].pos - m.pos) * 100}%`,
        }}
      />
    )}
          </React.Fragment>
        ))}
      </div>

      <div className="tl-labels">
      </div>

      {hovered && milestones.length > 0 && (
        <div className="tl-popup">
          {popupRows.map((row, rIdx) => (
            <div className="tl-popup-track" key={rIdx}>
              {row.map((m, i) => {
                const pos = posInRow(i, row.length);
                const edgeTransform =
                  i === 0
                    ? 'translateX(0%)'
                    : i === row.length - 1
                    ? 'translateX(-100%)'
                    : 'translateX(-50%)';
                return (
                  <React.Fragment key={i}>
                    <div
                      className={`tl-node tl-${m.type}`}
                      style={{ left: `${pos * 100}%` }}
                    />
                    <div
                      className="tl-popup-date"
                      style={{ left: `${pos * 100}%`, transform: edgeTransform }}
                    >
                      {m.date ? dayjs(m.date).format('DD/MM') : null}
                    </div>
                    {row[i + 1] && (
                      <div
                        className="tl-connector"
                        style={{
                          left: `${pos * 100 + 3}%`,
                          width: `${(posInRow(i + 1, row.length) - pos) * 100}%`,
                        }}
                      />
                    )}
                    <div
                      className="tl-popup-label"
                      style={{ left: `${pos * 100}%`, transform: edgeTransform }}
                    >
                      {m.label}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}