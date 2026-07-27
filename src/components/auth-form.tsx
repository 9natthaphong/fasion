"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
    <form className="auth-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {mode === "register" ? (
        <label>
          ชื่อที่แสดง
          <input autoComplete="name" {...form.register("displayName")} />
          <span className="field-error">{form.formState.errors.displayName?.message}</span>
        </label>
      ) : null}
      <label>
        อีเมล
        <input type="email" autoComplete="email" {...form.register("email")} />
        <span className="field-error">{form.formState.errors.email?.message}</span>
      </label>
      <label>
        รหัสผ่าน
        <input
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          {...form.register("password")}
        />
        <span className="field-error">{form.formState.errors.password?.message}</span>
      </label>
      {mode === "register" ? (
        <label className="check-row">
          <input type="checkbox" {...form.register("acceptTerms")} />
          <span>
            ฉันยอมรับ <Link href="/terms">ข้อกำหนด</Link> และ{" "}
            <Link href="/privacy">นโยบายความเป็นส่วนตัว</Link>
          </span>
          <span className="field-error">{form.formState.errors.acceptTerms?.message}</span>
        </label>
      ) : null}
      {serverError ? <div className="alert alert-error">{serverError}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}
      <button className="button button-solid" type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting
          ? "กำลังดำเนินการ…"
          : mode === "login"
            ? "เข้าสู่ระบบ"
            : "สร้างบัญชี"}
      </button>
      <div className="auth-links">
        <Link href={`/${mode}/${oppositeRole}`}>เข้าสู่ระบบสำหรับ{oppositeLabel}</Link>
        <Link href={mode === "login" ? `/register/${role}` : `/login/${role}`}>
          {mode === "login" ? "ยังไม่มีบัญชี? สมัคร" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}
        </Link>
      </div>
    </form>
  );
}
