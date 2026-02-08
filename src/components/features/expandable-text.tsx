"use client";

import { useState, useRef, useEffect } from "react";

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
}

export function ExpandableText({ text, maxLines = 4 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => setClamped(el.scrollHeight > el.clientHeight);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div>
      <p
        ref={ref}
        className="text-foreground/80 text-sm leading-relaxed break-words whitespace-pre-wrap"
        style={
          !expanded
            ? {
                display: "-webkit-box",
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : undefined
        }
      >
        {text}
      </p>
      {clamped && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-primary mt-1 py-1 text-sm font-medium"
        >
          더보기
        </button>
      )}
      {expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-primary mt-1 py-1 text-sm font-medium"
        >
          접기
        </button>
      )}
    </div>
  );
}
