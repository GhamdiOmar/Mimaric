"use client";

import { validatePassword, getPasswordStrengthHint } from "../lib/password-policy";

export function PasswordStrengthHint({
  password,
  lang = "ar",
  context,
}: {
  password: string;
  lang?: "ar" | "en";
  context?: { name?: string; email?: string };
}) {
  const hint = getPasswordStrengthHint(password);
  const validation = password ? validatePassword(password, context) : null;

  return (
    <div className="space-y-1.5 mt-1.5">
      {/* Character count bar */}
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${password.length >= 10 ? "bg-success" : "bg-warning"}`}
            style={{ width: `${Math.min((password.length / 10) * 100, 100)}%` }}
          />
        </div>
        <span className={`text-[10px] font-bold tabular-nums ${password.length >= 10 ? "text-success" : "text-muted-foreground"}`}>
          {password.length}/10
        </span>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-muted-foreground">{hint[lang]}</p>

      {/* Validation errors */}
      {validation && !validation.valid && (
        <ul className="space-y-0.5">
          {validation.errors.map((err, i) => (
            <li key={i} className="text-[10px] text-destructive">
              {err[lang]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
