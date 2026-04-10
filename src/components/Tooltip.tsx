import { ReactNode, useState, useRef, useLayoutEffect, useCallback } from "react";

interface TooltipProps {
  children: ReactNode;
  content: string;
  shortcut?: string[];
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export default function Tooltip({ children, content, shortcut, position = "top", className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [offset, setOffset] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const recalculate = useCallback(() => {
    const el = tooltipRef.current;
    if (!el) return;

    // Zoek de dichtstbijzijnde overflow-hidden container als grens
    const container = el.closest(".overflow-hidden") as HTMLElement | null;
    const bounds = container
      ? container.getBoundingClientRect()
      : { left: 0, right: window.innerWidth };

    const rect = el.getBoundingClientRect();
    const padding = 12;
    let shift = 0;

    if (rect.right > bounds.right - padding) {
      shift = -(rect.right - bounds.right + padding);
    } else if (rect.left < bounds.left + padding) {
      shift = bounds.left + padding - rect.left;
    }

    setOffset(shift);
  }, []);

  useLayoutEffect(() => {
    if (isVisible) recalculate();
    else setOffset(0);
  }, [isVisible, recalculate]);

  const axisClass = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className={`relative flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      <div
        ref={tooltipRef}
        role="tooltip"
        style={{ marginLeft: offset }}
        className={`absolute z-50 flex items-center gap-2 whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-[#1C1C1E] border border-white/10 text-[11px] font-medium text-gray-200 shadow-xl pointer-events-none transition-all duration-200 ${axisClass[position]} ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <span>{content}</span>
        {shortcut && shortcut.length > 0 && (
          <div className="flex items-center gap-1 ml-1">
            {shortcut.map((key, i) => (
              <kbd
                key={i}
                className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-white/10 text-white border border-white/20 rounded-[4px] font-mono text-[9px] uppercase tracking-wider shadow-sm"
              >
                {key}
              </kbd>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
