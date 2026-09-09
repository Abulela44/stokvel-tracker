import { LANGUAGES, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguagePicker({ className }: { className?: string }) {
  const { lang, setLang } = useT();
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
          className={cn(
            "tap-target rounded-xl border-2 px-2 text-sm font-semibold",
            lang === l.code
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-foreground",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
