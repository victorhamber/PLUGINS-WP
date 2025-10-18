import { useEffect } from "react";

/** ---- Tipos utilitários ---- */
type LogData = {
  message?: string;
  stack?: string;
  context?: Record<string, unknown>;
};

type AppFrame = { file: string; line: number; column: number };

/** ---- Stub de logger (substitua pelo real se houver) ---- */
function logDetailedError(title: string, data: LogData): { firstAppFrame?: AppFrame } {
  // eslint-disable-next-line no-console
  console.error(title, data);

  const stackLines = String(data.stack ?? "").split("\n") as string[];
  const frameLine =
    stackLines.find((l: string) => l.includes("client/src")) ||
    stackLines.find((l: string) => l.includes("/src/")) ||
    stackLines.find((l: string) => !l.includes("node_modules"));

  if (!frameLine) return {};

  // ex: at Component (client/src/pages/Subscriptions.tsx:155:27)
  const m = frameLine.match(/(?:\()?(.*?):(\d+):(\d+)\)?$/);
  if (!m) return {};

  const [, file, line, column] = m;
  return { firstAppFrame: { file, line: Number(line), column: Number(column) } };
}

/** ---- Componente ---- */
export default function GlobalMapErrorTap() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleError = (event: ErrorEvent) => {
      try {
        const msg = event.message || event.error?.message || "";
        if (!msg.includes(".map is not a function")) return;

        const info = {
          message: msg,
          fileName: event.filename || undefined,
          line: typeof event.lineno === "number" ? event.lineno : undefined,
          column: typeof event.colno === "number" ? event.colno : undefined,
          stack: event.error?.stack || undefined,
          path: window.location.pathname,
          time: new Date().toISOString(),
          userAgent: navigator.userAgent,
          sourceHint: undefined as string | undefined,
        };

        const stackLines = String(event.error?.stack || "").split("\n") as string[];
        const sourceLine =
          stackLines.find((l: string) => l.includes("client/src")) ||
          stackLines.find((l: string) => l.includes("/src/")) ||
          stackLines.find((l: string) => l.includes("node_modules"));
        if (sourceLine) info.sourceHint = sourceLine.trim();

        const { firstAppFrame } = logDetailedError(
          "[GlobalMapErrorTap] .map error capturado",
          {
            message: info.message,
            stack: info.stack,
            context: { path: info.path, time: info.time, userAgent: info.userAgent },
          }
        );

        (window as any).__lastMapError = { ...info, firstAppFrame };
        (window as any).__lastMapErrorQueue = [
          ...(Array.isArray((window as any).__lastMapErrorQueue)
            ? (window as any).__lastMapErrorQueue
            : []),
          info,
        ];

        if (firstAppFrame) {
          // eslint-disable-next-line no-console
          console.log(
            "[GlobalMapErrorTap] Possível localização:",
            `${firstAppFrame.file}:${firstAppFrame.line}:${firstAppFrame.column}`
          );
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[GlobalMapErrorTap] Falha ao processar erro .map:", e);
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      try {
        const reason: any = event.reason;
        const msg = String(reason?.message ?? reason ?? "");
        if (!msg.includes(".map is not a function")) return;

        const info = {
          message: msg,
          stack: reason?.stack || undefined,
          path: window.location.pathname,
          time: new Date().toISOString(),
          userAgent: navigator.userAgent,
          sourceHint: undefined as string | undefined,
        };

        const stackLines = String(reason?.stack || "").split("\n") as string[];
        const sourceLine =
          stackLines.find((l: string) => l.includes("client/src")) ||
          stackLines.find((l: string) => l.includes("/src/")) ||
          stackLines.find((l: string) => l.includes("node_modules"));
        if (sourceLine) info.sourceHint = sourceLine.trim();

        const { firstAppFrame } = logDetailedError(
          "[GlobalMapErrorTap] .map rejection capturado",
          {
            message: info.message,
            stack: info.stack,
            context: { path: info.path, time: info.time, userAgent: info.userAgent },
          }
        );

        (window as any).__lastMapError = { ...info, firstAppFrame };
        (window as any).__lastMapErrorQueue = [
          ...(Array.isArray((window as any).__lastMapErrorQueue)
            ? (window as any).__lastMapErrorQueue
            : []),
          info,
        ];

        if (firstAppFrame) {
          // eslint-disable-next-line no-console
          console.log(
            "[GlobalMapErrorTap] Possível localização:",
            `${firstAppFrame.file}:${firstAppFrame.line}:${firstAppFrame.column}`
          );
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[GlobalMapErrorTap] Falha ao processar rejection .map:", e);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
