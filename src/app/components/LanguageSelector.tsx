import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { LANGUAGES } from "../i18n/translations";
import { useLanguage } from "../contexts/LanguageContext";

export function LanguageSelector() {
  const { lang, setLang, currentLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current && !btnRef.current.contains(target) &&
        dropRef.current && !dropRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.top, left: rect.left });
    }
    setOpen((p) => !p);
  };

  const indian = LANGUAGES.filter((l) =>
    ["hi","ta","te","kn","ml","mr","bn","gu","pa","or","as","ur"].includes(l.code)
  );
  const international = LANGUAGES.filter((l) =>
    ["en","ar","es","fr","de","pt","zh","ja"].includes(l.code)
  );

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        onClick={handleToggle}
        title={currentLanguage.name}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-muted border border-border bg-card text-sm font-medium"
      >
        <span className="text-base leading-none">{currentLanguage.flag}</span>
        <ChevronDown className={`size-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && createPortal(
        <div
          ref={dropRef}
          style={{
            position: "fixed",
            bottom: `${window.innerHeight - dropPos.top}px`,
            left: `${dropPos.left}px`,
            width: "256px",
            zIndex: 9999,
          }}
          className="bg-card border rounded-xl shadow-xl overflow-hidden"
        >
          <div className="max-h-72 overflow-y-auto">
            <div className="px-3 py-2 sticky top-0 bg-muted/80 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                🇮🇳 Indian Languages
              </p>
            </div>
            {indian.map((l) => (
              <LangOption
                key={l.code}
                lang={l}
                selected={lang === l.code}
                onSelect={(code) => { setLang(code); setOpen(false); }}
              />
            ))}
            <div className="px-3 py-2 sticky top-0 bg-muted/80 backdrop-blur-sm border-t">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                🌍 International
              </p>
            </div>
            {international.map((l) => (
              <LangOption
                key={l.code}
                lang={l}
                selected={lang === l.code}
                onSelect={(code) => { setLang(code); setOpen(false); }}
              />
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function LangOption({
  lang, selected, onSelect,
}: { lang: typeof LANGUAGES[0]; selected: boolean; onSelect: (c: string) => void }) {
  return (
    <button
      onClick={() => onSelect(lang.code)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left ${selected ? "bg-primary/8" : ""}`}
    >
      <span className="text-base leading-none">{lang.flag}</span>
      <div className="flex-1 min-w-0">
        <span className={`font-medium block ${selected ? "text-primary" : ""}`}>{lang.name}</span>
        <span className="text-xs text-muted-foreground">{lang.label}</span>
      </div>
      {selected && <Check className="size-4 text-primary shrink-0" />}
    </button>
  );
}
