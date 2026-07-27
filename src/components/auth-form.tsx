"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Mail, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { loginSchema } from "@/lib/validation";

type Role = "customer" | "merchant";

export function AuthForm({
  mode,
  role,
}: {
  mode: "login" | "register";
  role: Role;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const schema = loginSchema
    .extend({
      displayName: z.string().trim(),
      role: z.enum(["customer", "merchant"]),
      acceptTerms: z.boolean(),
    })
    .superRefine((value, context) => {
      if (mode === "register" && (value.displayName.length < 2 || value.displayName.length > 100)) {
        context.addIssue({
          code: "custom",
          path: ["displayName"],
          message: "กรุณาใส่ชื่อ 2–100 ตัวอักษร",
        });
      }
      if (mode === "register" && !value.acceptTerms) {
        context.addIssue({
          code: "custom",
          path: ["acceptTerms"],
          message: "กรุณายอมรับข้อกำหนดการใช้งาน",
        });
      }
    });

  type FormValues = z.infer<typeof schema>;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      role,
      acceptTerms: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSuccess(null);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, role }),
      });
      const data = (await response.json()) as {
        error?: string;
        redirectTo?: string;
        message?: string;
      };
      if (!response.ok) {
        setServerError(data.error ?? "ไม่สามารถดำเนินการได้");
        return;
      }
      if (data.message && !data.redirectTo) {
        setSuccess(data.message);
        form.reset();
        return;
      }
      const requestedNext = searchParams.get("next");
      router.push(requestedNext?.startsWith("/") ? requestedNext : data.redirectTo ?? "/");
      router.refresh();
    } catch {
      setServerError("เชื่อมต่อระบบไม่ได้ กรุณาลองอีกครั้ง");
    }
  };

  const oppositeRole = role === "customer" ? "merchant" : "customer";
  const oppositeLabel = role === "customer" ? "ร้านค้า" : "ลูกค้า";

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {mode === "register" ? (
        <div>
          <label className="block text-sm font-medium mb-1">ชื่อที่แสดง</label>
          <div className="relative">
            <User className="w-4 h-4 text-muted absolute left-3 top-3" />
            <input
              className="w-full pl-9 pr-3 py-2.5 bg-background border border-line rounded-lg text-sm"
              placeholder="สมชาย ใจดี"
              autoComplete="name"
              {...form.register("displayName")}
            />
          </div>
          {form.formState.errors.displayName ? (
            <small className="text-xs text-danger mt-1 block">{form.formState.errors.displayName.message}</small>
          ) : null}
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium mb-1">อีเมล</label>
        <div className="relative">
          <Mail className="w-4 h-4 text-muted absolute left-3 top-3" />
          <input
            className="w-full pl-9 pr-3 py-2.5 bg-background border border-line rounded-lg text-sm"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            {...form.register("email")}
          />
        </div>
        {form.formState.errors.email ? (
          <small className="text-xs text-danger mt-1 block">{form.formState.errors.email.message}</small>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">รหัสผ่าน</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-muted absolute left-3 top-3" />
          <input
            className="w-full pl-9 pr-10 py-2.5 bg-background border border-line rounded-lg text-sm"
            type={showPassword ? "text" : "password"}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            {...form.register("password")}
          />
          <button
            type="button"
            className="absolute right-3 top-2.5 text-muted hover:text-charcoal"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {form.formState.errors.password ? (
          <small className="text-xs text-danger mt-1 block">{form.formState.errors.password.message}</small>
        ) : null}
      </div>

      {mode === "register" ? (
        <div>
          <label className="flex items-start gap-2.5 text-xs text-muted cursor-pointer mt-2">
            <input type="checkbox" className="mt-0.5 rounded border-line text-olive focus:ring-olive" {...form.register("acceptTerms")} />
            <span>
              ฉันยอมรับ{" "}
              <Link href="/terms" className="underline hover:text-charcoal">
                ข้อกำหนด
              </Link>{" "}
              และ{" "}
              <Link href="/privacy" className="underline hover:text-charcoal">
                นโยบายความเป็นส่วนตัว
              </Link>
            </span>
          </label>
          {form.formState.errors.acceptTerms ? (
            <small className="text-xs text-danger mt-1 block">{form.formState.errors.acceptTerms.message}</small>
          ) : null}
        </div>
      ) : null}

      {serverError ? (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-xs flex items-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      ) : null}

      {success ? (
        <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-success text-xs flex items-center gap-2" role="alert">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      <button
        className="w-full button button-solid py-2.5 mt-2 text-sm font-medium"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting
          ? "กำลังดำเนินการ…"
          : mode === "login"
            ? "เข้าสู่ระบบ"
            : "สร้างบัญชี"}
      </button>

      <div className="pt-4 border-t border-line mt-4 flex flex-col gap-2 text-xs text-center text-muted">
        <Link href={`/${mode}/${oppositeRole}`} className="hover:text-charcoal underline">
          เข้าสู่ระบบสำหรับ{oppositeLabel}
        </Link>
        <Link href={mode === "login" ? `/register/${role}` : `/login/${role}`} className="hover:text-charcoal font-medium text-olive">
          {mode === "login" ? "ยังไม่มีบัญชี? สมัครที่นี่" : "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ"}
        </Link>
      </div>
    </form>
  );
}
