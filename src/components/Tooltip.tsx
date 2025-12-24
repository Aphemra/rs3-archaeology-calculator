import "./Tooltip.css";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Placement = "top" | "bottom" | "left" | "right";

type Props = {
  content: ReactNode;
  children: ReactNode;
  placement?: Placement;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function resolvePlacement(rect: DOMRect, preferred: Placement): Placement {
  const viewWidth = window.innerWidth;
  const viewHeight = window.innerHeight;

  const overLeft = rect.left < 0;
  const overRight = rect.right > viewWidth;
  const overTop = rect.top < 0;
  const overBottom = rect.bottom > viewHeight;

  switch (preferred) {
    case "top":
    case "bottom":
      if (overLeft) return "right";
      if (overRight) return "left";
      if (preferred === "top" && overTop) return "bottom";
      if (preferred === "bottom" && overBottom) return "top";
      return preferred;
    case "left":
    case "right":
      if (preferred === "left" && overLeft) return "right";
      if (preferred === "right" && overRight) return "left";
      if (overTop) return "bottom";
      if (overBottom) return "top";
      return preferred;
  }
}

export default function Tooltip({ content, children, placement = "top" }: Props) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);

  const lastGoodPlacementRef = useRef<Placement>(placement);

  const bubblePositionRef = useRef<{ top: number; left: number }>({ top: 0, left: 0 });
  const bubblePlacementRef = useRef<Placement>(placement);

  useLayoutEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const bubble = bubbleRef.current;
    if (!trigger || !bubble) return;

    const offset = 8;

    const apply = () => {
      const start = lastGoodPlacementRef.current ?? placement;

      bubble.dataset.placement = start;
      bubblePlacementRef.current = start;

      const triggerBounds = trigger.getBoundingClientRect();
      const bubbleBounds = bubble.getBoundingClientRect();

      const computePosition = (p: Placement) => {
        let top = 0;
        let left = 0;

        if (p === "top") {
          top = triggerBounds.top - bubbleBounds.height - offset;
          left = triggerBounds.left + triggerBounds.width / 2 - bubbleBounds.width / 2;
        } else if (p === "bottom") {
          top = triggerBounds.bottom + offset;
          left = triggerBounds.left + triggerBounds.width / 2 - bubbleBounds.width / 2;
        } else if (p === "left") {
          top = triggerBounds.top + triggerBounds.height / 2 - bubbleBounds.height / 2;
          left = triggerBounds.left - bubbleBounds.width - offset;
        } else {
          top = triggerBounds.top + triggerBounds.height / 2 - bubbleBounds.height / 2;
          left = triggerBounds.right + offset;
        }

        top = clamp(top, 8, window.innerHeight - bubbleBounds.height - 8);
        left = clamp(left, 8, window.innerWidth - bubbleBounds.width - 8);

        return { top, left };
      };

      let position = computePosition(start);
      bubble.style.top = `${position.top}px`;
      bubble.style.left = `${position.left}px`;

      const after = bubble.getBoundingClientRect();
      const next = resolvePlacement(after, start);

      if (next !== start) {
        bubble.dataset.placement = next;
        bubblePlacementRef.current = next;

        position = computePosition(next);
        bubble.style.top = `${position.top}px`;
        bubble.style.left = `${position.left}px`;
      }

      bubblePositionRef.current = position;
      lastGoodPlacementRef.current = bubblePlacementRef.current;
    };

    const raf = requestAnimationFrame(apply);

    const onReposition = () => {
      if (!bubbleRef.current || !triggerRef.current) return;
      apply();
    };

    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open, placement]);

  return (
    <>
      <span
        ref={triggerRef}
        className="tooltip"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <span className="tooltip-trigger">{children}</span>
      </span>
      {open &&
        createPortal(
          <div ref={bubbleRef} className="tooltip-bubble tooltip-bubble-portal" style={{ position: "fixed" }}>
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
