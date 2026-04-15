import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { Button } from "./ui/button";

interface ThemeToggleProps {
  theme: "light" | "dark";
  onToggle: () => void;
}

const ThemeToggle = ({ theme, onToggle }: ThemeToggleProps) => {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      className="rounded-2xl border border-border bg-card/80 text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-card/95 dark:bg-surface/80 dark:hover:bg-surface/90"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </Button>
  );
};

export default ThemeToggle;
