/**
 * Structured JSON logger for production.
 * Every log line is one JSON object — ship to CloudWatch / Datadog / Loki.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

function levelEnabled(level: LogLevel): boolean {
  const order: LogLevel[] = ["debug", "info", "warn", "error"];
  const min = (process.env.LOG_LEVEL as LogLevel) || "info";
  return order.indexOf(level) >= order.indexOf(min);
}

function emit(level: LogLevel, msg: string, fields?: LogFields) {
  if (!levelEnabled(level)) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    msg,
    service: "edupro",
    ...fields,
  };
  const out = JSON.stringify(line);
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.log(out);
}

export const logger = {
  debug: (msg: string, fields?: LogFields) => emit("debug", msg, fields),
  info: (msg: string, fields?: LogFields) => emit("info", msg, fields),
  warn: (msg: string, fields?: LogFields) => emit("warn", msg, fields),
  error: (msg: string, fields?: LogFields) => emit("error", msg, fields),
  child(base: LogFields) {
    return {
      debug: (msg: string, fields?: LogFields) =>
        emit("debug", msg, { ...base, ...fields }),
      info: (msg: string, fields?: LogFields) =>
        emit("info", msg, { ...base, ...fields }),
      warn: (msg: string, fields?: LogFields) =>
        emit("warn", msg, { ...base, ...fields }),
      error: (msg: string, fields?: LogFields) =>
        emit("error", msg, { ...base, ...fields }),
    };
  },
};

export function newRequestId(): string {
  // crypto.randomUUID available in Node 20+
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
