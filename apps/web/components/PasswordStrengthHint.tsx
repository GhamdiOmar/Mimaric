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
      {/* Character count */}
      <div className="flex items-center gap-2">
        <div className={`h-1 flex-1 rounded-full ${password.length >= 10 ? "bg-emerald-400" : "bg-neutral/20"}`}>
          <div
            className={`h-full rounded-full transition-all ${password.length >= 10 ? "bg-emerald-500" : "bg-amber-400"}`}
            style={{ width: `${Math.min((password.length / 10) * 100, 100)}%` }}
          />
        </div>
        <span className={`text-[10px] font-bold font-latin ${password.length >= 10 ? "text-emerald-600" : "text-neutral"}`}>
          {password.length}/10
        </span>
      </div>

      {/* Hint text */}
      <p className="text-[10px] text-neutral font-primary">{hint[lang]}</p>

      {/* Validation errors */}
      {validation && !validation.valid && (
        <ul className="space-y-0.5">
          {validation.errors.map((err, i) => (
            <li key={i} className="text-[10px] text-red-500 font-primary">
              {err[lang]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
