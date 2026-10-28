import { useEffect, useState } from "react";
import { useAccessibility } from "../../contexts/accessibility";

const BAND_HEIGHT = 132;

export default function ReadingGuide() {
  const { readingGuide } = useAccessibility();
  const [position, setPosition] = useState(() =>
    typeof window === "undefined" ? 0 : window.innerHeight / 2,
  );
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setIsCoarsePointer(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!readingGuide || isCoarsePointer) return;

    const handlePointerMove = (event: PointerEvent) => setPosition(event.clientY);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [readingGuide, isCoarsePointer]);

  if (!readingGuide || isCoarsePointer) return null;

  const topHeight = Math.max(0, position - BAND_HEIGHT / 2);
  const bottomHeight = Math.max(0, window.innerHeight - position - BAND_HEIGHT / 2);

  return (
    <div
      data-voice-reader-ui=""
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9998]"
    >
      <div className="absolute inset-x-0 top-0 bg-slate-900/65" style={{ height: topHeight }} />
      <div className="absolute inset-x-0 bottom-0 bg-slate-900/65" style={{ height: bottomHeight }} />
      <div
        className="absolute inset-x-0 h-0.5 bg-orange-400/80 shadow-[0_0_12px_rgba(251,146,60,0.8)]"
        style={{ top: position }}
      />
    </div>
  );
}
