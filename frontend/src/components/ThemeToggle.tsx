import { Moon, Sun } from "lucide-react";
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
      className="h-9 w-9 rounded-[8px] border-border bg-transparent text-secondary shadow-none hover:bg-elevated hover:text-foreground"
      aria-label="Toggle theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} appearance`}
    >
      {theme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
};

export default ThemeToggle;
