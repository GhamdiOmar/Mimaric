"use client";

import { useLanguage } from "../../../../components/LanguageProvider";
import * as React from "react";
import { Button, Input } from "@repo/ui";
import { LockKey, CheckCircle, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useSession } from "../../../../components/SimpleSessionProvider";
import { PasswordStrengthHint } from "../../../../components/PasswordStrengthHint";
import { changePassword } from "../../../actions/password";

export default function SecuritySettingsPage() {
  const { lang } = useLanguage();
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const errorMessages: Record<string, { ar: string; en: string }> = {
    WRONG_PASSWORD: { ar: "كلمة المرور الحالية غير صحيحة.", en: "Current password is incorrect." },
    SAME_PASSWORD: { ar: "كلمة المرور الجديدة يجب أن تختلف عن الحالية.", en: "New password must be different from current." },
    MISMATCH: { ar: "كلمتا المرور غير متطابقتين.", en: "Passwords do not match." },
  };

  const handleChange = async () => {
    if (newPassword !== confirmPassword) {
      setError(errorMessages.MISMATCH![lang]);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await changePassword({ currentPassword, newPassword });
      if (result.error) {
        if (result.error === "WEAK_PASSWORD" && result.details) {
          setError(result.details.map((e: any) => e[lang]).join(" "));
        } else {
          const msg = errorMessages[result.error];
          setError(msg ? msg[lang] : (lang === "ar" ? "حدث خطأ." : "An error occurred."));
        }
      } else {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError(lang === "ar" ? "حدث خطأ في النظام." : "System error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard/settings" className="text-neutral hover:text-primary transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-primary font-primary">
              {lang === "ar" ? "الأمان" : "Security"}
            </h1>
          </div>
          <p className="text-sm text-neutral mt-1 font-primary">
            {lang === "ar" ? "تغيير كلمة المرور وإعدادات الأمان." : "Change your password and security settings."}
          </p>
        </div>
      </div>

      <div className="max-w-lg">
        <div className="bg-card rounded-md shadow-card border border-border overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/5 rounded-md text-primary">
                <LockKey size={24} weight="duotone" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-primary font-primary">{lang === "ar" ? "تغيير كلمة المرور" : "Change Password"}</h2>
                <p className="text-[10px] text-neutral font-primary">{lang === "ar" ? "استخدم عبارة من 3+ كلمات عشوائية" : "Use a passphrase of 3+ random words"}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle size={18} weight="fill" />
                {lang === "ar" ? "تم تحديث كلمة المرور بنجاح." : "Password updated successfully."}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">
                {lang === "ar" ? "كلمة المرور الحالية" : "Current Password"}
              </label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={loading} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">
                {lang === "ar" ? "كلمة المرور الجديدة" : "New Password"}
              </label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={loading} />
              <PasswordStrengthHint
                password={newPassword}
                lang={lang}
                context={{ name: session?.user?.name ?? undefined, email: session?.user?.email ?? undefined }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral">
                {lang === "ar" ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
              </label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} />
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleChange}
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            >
              <CheckCircle size={18} />
              {loading ? (lang === "ar" ? "جاري التحديث..." : "Updating...") : (lang === "ar" ? "تحديث كلمة المرور" : "Update Password")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
