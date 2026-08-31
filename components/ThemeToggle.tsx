// PATH: components/ThemeToggle.tsx
// AKSI: BUAT FILE BARU (toggle 3-arah Light/Dark/System, touch target 44x44px)

"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme/theme-provider";

const options: { value: Theme; icon: React.ElementType; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex items-center gap-1 rounded-full p-1"
      style={{ backgroundColor: "var(--muted)" }}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-label={opt.label}
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors"
            style={
              isActive
                ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }
                : { color: "var(--muted-foreground)" }
            }
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
