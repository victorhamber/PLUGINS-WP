// Utility helpers to parse error stacks and log precise locations in console
export type StackFrame = {
  raw: string;
  file?: string;
  line?: number;
  column?: number;
  method?: string;
};

function parseFrame(line: string): StackFrame {
  const raw = line.trim();
  // Try to extract method and location
  // Examples:
  //   at SomeComponent (http://localhost:5000/src/pages/Store.tsx:123:45)
  //   at http://localhost:5000/assets/index-XXXX.js:1234:56
  //   at C:\path\client\src\pages\Store.tsx:123:45: in dev
  const methodMatch = raw.match(/^at\s+([^\(]+)\s*\(/);
  const method = methodMatch ? methodMatch[1].trim() : undefined;

  const locationMatch =
    raw.match(/(\w:\\[^:]+\.(?:tsx|ts|jsx|js)):(\d+):(\d+)/) || // Windows path
    raw.match(/(\/[^\s\)]+\.(?:tsx|ts|jsx|js)):(\d+):(\d+)/) || // POSIX path
    raw.match(/(https?:\/\/[^\s\)]+\.(?:tsx|ts|jsx|js)):(\d+):(\d+)/); // URL

  if (locationMatch) {
    const [, file, line, column] = locationMatch;
    return {
      raw,
      method,
      file,
      line: Number(line),
      column: Number(column),
    };
  }
  return { raw, method };
}

export function extractFrames(stack?: string): StackFrame[] {
  if (!stack) return [];
  return stack
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map(parseFrame);
}

export function findFirstAppFrame(frames: StackFrame[]): StackFrame | undefined {
  const isAppFile = (f?: string) =>
    !!f && (
      f.includes("/client/src/") ||
      f.includes("/src/pages/") ||
      f.includes("/src/components/") ||
      f.includes("/src/hooks/") ||
      /\\client\\src\\/.test(f)
    );

  return frames.find((fr) => isAppFile(fr.file));
}

export function logDetailedError(
  title: string,
  payload: {
    message?: string;
    stack?: string;
    componentStack?: string;
    context?: Record<string, unknown>;
  }
): { frames: StackFrame[]; firstAppFrame?: StackFrame } {
  const frames = extractFrames(payload.stack);
  const firstAppFrame = findFirstAppFrame(frames);

  try {
    console.groupCollapsed(`%c${title}`, "color: #b91c1c; font-weight: 600;");
    if (payload.message) console.error("Message:", payload.message);
    if (payload.context) console.log("Context:", payload.context);
    if (firstAppFrame) {
      console.log(
        "%cLikely location:",
        "color:#2563eb",
        `${firstAppFrame.file}:${firstAppFrame.line}:${firstAppFrame.column}`,
        firstAppFrame.method ? `(in ${firstAppFrame.method})` : ""
      );
    }
    if (payload.componentStack) {
      console.log("Component stack:", payload.componentStack);
    }
    if (payload.stack) {
      console.log("Stack:");
      payload.stack.split("\n").forEach((l) => console.log(l));
    }
    console.groupEnd();
  } catch {
    // noop
  }

  return { frames, firstAppFrame };
}