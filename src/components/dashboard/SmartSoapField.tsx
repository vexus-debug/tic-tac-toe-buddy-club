import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { expandMacro } from "@/lib/soapMacros";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

/** SOAP textarea with dot-macro expansion (".endo-prep" + space/tab) and hands-free dictation. */
export function SmartSoapField({ value, onChange, placeholder, rows = 2, maxLength = 2000 }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<any>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    setSupported(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
    return () => recRef.current?.stop?.();
  }, []);

  const toggleDictation = () => {
    if (listening) { recRef.current?.stop(); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) text += e.results[i][0].transcript;
      if (!text.trim()) return;
      const cur = valueRef.current;
      onChange((cur + (cur && !/\s$/.test(cur) ? " " : "") + text.trim()).slice(0, maxLength));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  return (
    <div className="relative">
      <Textarea
        maxLength={maxLength}
        rows={rows}
        value={value}
        placeholder={placeholder}
        className="pr-10"
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(" ")) {
            const expanded = expandMacro(v.slice(0, -1));
            if (expanded) { onChange(expanded.slice(0, maxLength)); return; }
          }
          onChange(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            const expanded = expandMacro(value);
            if (expanded) { e.preventDefault(); onChange(expanded.slice(0, maxLength)); }
          }
        }}
      />
      {supported && (
        <Button
          type="button"
          size="icon"
          variant={listening ? "destructive" : "ghost"}
          className="absolute right-1 top-1 h-7 w-7"
          title={listening ? "Stop dictation" : "Dictate (hands-free)"}
          onClick={toggleDictation}
        >
          {listening ? <MicOff className="h-3.5 w-3.5 animate-pulse" /> : <Mic className="h-3.5 w-3.5" />}
        </Button>
      )}
    </div>
  );
}
