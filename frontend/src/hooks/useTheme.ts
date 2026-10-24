import { useCallback, useEffect, useState } from "react";

type ThemeMode = "light" | "dark";
export type AccentPresetId = "mint" | "ocean" | "coral" | "amber";

export const ACCENT_PRESETS: Record<AccentPresetId, { name: string; color: string }> = {
  mint: { name: "Connectly Mint", color: "#70D6C7" },
  ocean: { name: "Ocean", color: "#79B8FF" },
  coral: { name: "Coral", color: "#F28C83" },
  amber: { name: "Amber", color: "#EABD69" },
};

export type AccentSelection =
  | { kind: "preset"; preset: AccentPresetId }
  | { kind: "custom"; color: string };

const STORAGE_KEY = "connectly-theme";
const ACCENT_STORAGE_KEY = "connectly-accent-theme";
const HEX_COLOR = /^#[\da-f]{6}$/i;

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return "dark";
};

const applyTheme = (theme: ThemeMode) => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  window.localStorage.setItem(STORAGE_KEY, theme);
};

const isAccentPreset = (value: string): value is AccentPresetId => value in ACCENT_PRESETS;

const getInitialAccent = (): AccentSelection => {
  if (typeof window === "undefined") return { kind: "preset", preset: "mint" };
  const saved = window.localStorage.getItem(ACCENT_STORAGE_KEY);
  if (saved && isAccentPreset(saved)) return { kind: "preset", preset: saved };
  if (saved && HEX_COLOR.test(saved)) return { kind: "custom", color: saved.toUpperCase() };
  return { kind: "preset", preset: "mint" };
};

const mixColor = (hex: string, mixWith: number, amount: number) => {
  const channels = hex.slice(1).match(/.{2}/g)?.map((channel) => Number.parseInt(channel, 16)) ?? [112, 214, 199];
  const mixed = channels.map((channel) => Math.round(channel * (1 - amount) + mixWith * amount));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
};

const relativeLuminance = (hex: string) => {
  const channels = hex.slice(1).match(/.{2}/g)?.map((channel) => Number.parseInt(channel, 16) / 255) ?? [0.44, 0.84, 0.78];
  const [red, green, blue] = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const applyAccent = (selection: AccentSelection, theme: ThemeMode) => {
  const color = selection.kind === "preset" ? ACCENT_PRESETS[selection.preset].color : selection.color;
  const root = document.documentElement;
  const foreground = relativeLuminance(color) > 0.42 ? "#10151B" : "#FFFFFF";
  const hover = mixColor(color, theme === "dark" ? 255 : 0, 0.12);
  const [red, green, blue] = color.slice(1).match(/.{2}/g)?.map((part) => Number.parseInt(part, 16) / 255) ?? [0.44, 0.84, 0.78];
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  let hue = 0;
  if (delta) {
    if (maximum === red) hue = ((green - blue) / delta) % 6;
    else if (maximum === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  const lightness = (maximum + minimum) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  const surfaceSaturation = Math.round(Math.min(theme === "dark" ? 14 : 11, Math.max(2.5, saturation * (theme === "dark" ? 16 : 12))));
  const surface = (light: number, saturationPercent = surfaceSaturation) => `hsl(${Math.round(hue)} ${saturationPercent}% ${light}%)`;
  const palette = theme === "dark"
    ? {
        background: surface(7), card: surface(11), popover: surface(15), muted: surface(13),
        elevated: surface(15), foreground: surface(95, 8), secondary: surface(68, 8),
        mutedForeground: surface(60, 7), border: surface(23, 8),
      }
    : {
        background: surface(97), card: surface(100), popover: surface(100), muted: surface(93),
        elevated: surface(94), foreground: surface(11, 18), secondary: surface(42, 14),
        mutedForeground: surface(45, 13), border: surface(85, 12),
      };

  root.style.setProperty("--background", palette.background);
  root.style.setProperty("--foreground", palette.foreground);
  root.style.setProperty("--card", palette.card);
  root.style.setProperty("--card-foreground", palette.foreground);
  root.style.setProperty("--popover", palette.popover);
  root.style.setProperty("--popover-foreground", palette.foreground);
  root.style.setProperty("--secondary", palette.secondary);
  root.style.setProperty("--secondary-foreground", palette.foreground);
  root.style.setProperty("--muted", palette.muted);
  root.style.setProperty("--muted-foreground", palette.mutedForeground);
  root.style.setProperty("--elevated", palette.elevated);
  root.style.setProperty("--border", palette.border);
  root.style.setProperty("--input", palette.border);
  root.style.setProperty("--sidebar", palette.card);
  root.style.setProperty("--sidebar-foreground", palette.foreground);
  root.style.setProperty("--sidebar-accent", palette.muted);
  root.style.setProperty("--sidebar-accent-foreground", palette.foreground);
  root.style.setProperty("--sidebar-border", palette.border);
  root.style.setProperty("--accent", color);
  root.style.setProperty("--primary", color);
  root.style.setProperty("--accent-hover", hover);
  root.style.setProperty("--accent-foreground", foreground);
  root.style.setProperty("--primary-foreground", foreground);
  root.style.setProperty("--ring", color);
  root.style.setProperty("--sidebar-primary", color);
  root.style.setProperty("--sidebar-primary-foreground", foreground);
  root.style.setProperty("--sidebar-ring", color);
};

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [accentSelection, setAccentSelection] = useState<AccentSelection>(() => getInitialAccent());
  const accentColor = accentSelection.kind === "preset" ? ACCENT_PRESETS[accentSelection.preset].color : accentSelection.color;

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyAccent(accentSelection, theme);
    window.localStorage.setItem(ACCENT_STORAGE_KEY, accentSelection.kind === "preset" ? accentSelection.preset : accentSelection.color);
  }, [accentSelection, theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const selectAccentPreset = useCallback((preset: AccentPresetId) => {
    setAccentSelection({ kind: "preset", preset });
  }, []);

  const selectCustomAccent = useCallback((color: string) => {
    if (HEX_COLOR.test(color)) setAccentSelection({ kind: "custom", color: color.toUpperCase() });
  }, []);

  return { theme, toggleTheme, accentSelection, accentColor, selectAccentPreset, selectCustomAccent };
};
