import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { ACCENT_PRESETS } from "@/hooks/useTheme";
import type { AccentPresetId, AccentSelection } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";

interface ThemePickerProps {
  selection: AccentSelection;
  color: string;
  onSelectPreset: (preset: AccentPresetId) => void;
  onSelectCustom: (color: string) => void;
}

const PRESET_IDS = Object.keys(ACCENT_PRESETS) as AccentPresetId[];

const ThemePicker = ({ selection, color, onSelectPreset, onSelectCustom }: ThemePickerProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isCustom = selection.kind === "custom";

  useEffect(() => {
    if (!open) return;
    const firstOption = panelRef.current?.querySelector<HTMLButtonElement>("[data-theme-option]");
    firstOption?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const choosePreset = (preset: AccentPresetId) => {
    onSelectPreset(preset);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen((current) => !current)}
        className="h-9 w-9 rounded-[8px] border-border bg-transparent text-secondary shadow-none hover:bg-elevated hover:text-foreground"
        aria-label="Choose color theme"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="connectly-theme-picker"
        title="Choose color theme"
      >
        <Palette className="size-4" />
      </Button>

      {open && (
        <div
          ref={panelRef}
          id="connectly-theme-picker"
          role="dialog"
          aria-label="Choose a color theme"
          className="absolute right-0 top-full z-50 mt-2 w-[min(88vw,288px)] rounded-[10px] border border-border bg-popover p-3.5 text-popover-foreground shadow-xl"
        >
          <div className="mb-3 px-1">
            <h2 className="text-sm font-semibold">Color theme</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Choose a palette or make your own.</p>
          </div>

          <div role="group" aria-label="Preset color themes" className="space-y-1">
            {PRESET_IDS.map((preset) => {
              const item = ACCENT_PRESETS[preset];
              const selected = selection.kind === "preset" && selection.preset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  data-theme-option
                  aria-pressed={selected}
                  onClick={() => choosePreset(preset)}
                  className="flex min-h-10 w-full items-center gap-3 rounded-[7px] px-2.5 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="size-4 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: item.color }} aria-hidden="true" />
                  <span className="flex-1">{item.name}</span>
                  {selected && <Check size={15} className="text-accent" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <div>
              <p className="text-sm font-medium">Create your theme</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Pick a color for the full palette.</p>
            </div>
            <input
              type="color"
              value={isCustom ? selection.color : color}
              onChange={(event) => onSelectCustom(event.target.value)}
              aria-label="Choose a custom theme color"
              title="Choose a custom theme color"
              className={`size-10 cursor-pointer rounded-[8px] border border-border bg-transparent p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isCustom ? "ring-2 ring-accent ring-offset-2 ring-offset-popover" : ""}`}
            />
          </div>
          {isCustom && <p className="mt-2 text-right font-mono text-[11px] uppercase text-muted-foreground">{selection.color}</p>}
        </div>
      )}
    </div>
  );
};

export default ThemePicker;
