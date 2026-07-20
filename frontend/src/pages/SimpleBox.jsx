import { useState } from "react";
import './SimpleBox.scss'


const TIMELINE = {
  duration: 1.4,
  delayStart: 0,
  easing: "ease-in-out",
  iterations: "infinite",
};

export default function SimpleBox() {
  const [replay, setReplay] = useState(0);

  const boxStyle = {
    animationDuration: `${TIMELINE.duration}s`,
    animationDelay: `${TIMELINE.delayStart}s`,
    animationTimingFunction: TIMELINE.easing,
    animationIterationCount: TIMELINE.iterations,
  };

  return (
    <div className="wrapper">
      <div
        key={replay}
        className="box"
        style={boxStyle}
        onClick={() => setReplay((r) => r + 1)}
      />
    </div>
  );
}