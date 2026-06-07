import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type Variant = "success" | "error" | "info";
interface Toast { id: string; message: string; variant: Variant; }
interface ToastCtx { toast: (message: string, variant?: Variant) => void; }

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, variant: Variant = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, message, variant }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const dismiss = (id: string) => setToasts(p => p.filter(t => t.id !== id));
  const icons: Record<Variant, React.ReactNode> = {
    success: <CheckCircle size={15} />, error: <AlertCircle size={15} />, info: <Info size={15} />,
  };
  const colors: Record<Variant, string> = {
    success: "#22c55e", error: "#f87171", info: "#60a5fa",
  };
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div style={{ position:"fixed", bottom:80, right:16, zIndex:9999, display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
        {toasts.map(t => (
          <div key={t.id} className="animate-fade-up" style={{
            display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
            background:"rgba(20,20,48,0.97)", border:`1px solid ${colors[t.variant]}44`,
            borderRadius:12, boxShadow:`0 4px 24px rgba(0,0,0,0.5)`,
            color:"var(--text-1)", fontFamily:"var(--font-body)", fontSize:14, maxWidth:320,
          }}>
            <span style={{ color:colors[t.variant], flexShrink:0 }}>{icons[t.variant]}</span>
            <span style={{ flex:1 }}>{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-3)", padding:2, flexShrink:0 }}>
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);
