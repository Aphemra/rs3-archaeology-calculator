import "./NumericInput.css";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value"> & {
  value: number;
  onChange: (value: number) => void;

  min?: number;
  max?: number;
  step?: number;

  integer?: boolean;
};

function clamp(number: number, min?: number, max?: number) {
  let out = number;
  if (typeof min === "number") out = Math.max(min, out);
  if (typeof max === "number") out = Math.min(max, out);
  return out;
}

export default function NumericInput({ value, onChange, min, max, step = 1, integer = true, className, disabled, ...rest }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<string>(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const stepAmount = useMemo(() => {
    const s = Number(step);
    return Number.isFinite(s) && s !== 0 ? s : 1;
  }, [step]);

  function parseDraft(s: string) {
    const num = Number(s);
    if (!Number.isFinite(num)) return null;
    const maybeInt = integer ? Math.floor(num) : num;
    return clamp(maybeInt, min, max);
  }

  function commitDraft() {
    const parsed = parseDraft(draft);
    if (parsed === null) {
      setDraft(String(value));
      return;
    }
    onChange(parsed);
  }

  function nudge(delta: number) {
    if (disabled) return;

    const base = Number.isFinite(value) ? value : 0;
    const nextRaw = base + delta;

    const next = clamp(integer ? Math.floor(nextRaw) : nextRaw, min, max);
    onChange(next);

    setDraft(String(next));

    inputRef.current?.focus();
  }

  const canDecrement = typeof min === "number" ? value > min : true;
  const canIncrement = typeof max === "number" ? value < max : true;

  return (
    <div className={`num ${className ?? ""}`} data-disabled={disabled ? "true" : "false"}>
      <input
        ref={inputRef}
        className="num-input"
        inputMode="numeric"
        type="text"
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitDraft();
          if (e.key === "Escape") setDraft(String(value));
          if (e.key === "ArrowUp") {
            e.preventDefault();
            if (canIncrement) nudge(stepAmount);
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (canDecrement) nudge(-stepAmount);
          }
        }}
        {...rest}
      />

      <div className="num-stepper">
        <button type="button" className="num-button" onClick={() => nudge(stepAmount)} disabled={disabled || !canIncrement} tabIndex={-1}>
          ▲
        </button>
        <button type="button" className="num-button" onClick={() => nudge(-stepAmount)} disabled={disabled || !canDecrement} tabIndex={-1}>
          ▼
        </button>
      </div>
    </div>
  );
}
