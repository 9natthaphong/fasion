"use client";

import { useTransition } from "react";
import { saveAppearanceSettings } from "@/app/account/settings/appearance-actions";
import { Palette, Lock } from "lucide-react";

export function AppearanceSettingsForm({ isPro, currentSettings }: { isPro: boolean, currentSettings: { theme?: string, accent?: string } }) {
  const [isPending, startTransition] = useTransition();

  const theme = currentSettings?.theme || "system";
  const accent = currentSettings?.accent || "olive";

  if (!isPro) {
    return (
      <div className="border border-line bg-paper p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase border-b border-line pb-4">
          <Palette className="w-4 h-4 text-olive" />
          <span>Appearance / ธีมและการแสดงผล</span>
        </div>
        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg">
          <Lock className="w-6 h-6 text-muted-foreground" />
          <div>
            <p className="font-bold text-sm">อัปเกรด Pro เพื่อปลดล็อก</p>
            <p className="text-xs text-muted-foreground">ปรับแต่งธีม (Light/Dark) และสีหลักของแอปพลิเคชันได้เมื่อคุณเป็นสมาชิก Pro</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-line bg-paper p-6 sm:p-8 space-y-6">
      <div className="space-y-1 border-b border-line pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase">
          <Palette className="w-4 h-4 text-olive" />
          <span>Appearance / ธีมและการแสดงผล (Pro)</span>
        </div>
        <h2 className="font-serif text-2xl font-normal text-charcoal">ปรับแต่งการแสดงผล</h2>
      </div>

      <form
        action={(formData) => {
          startTransition(() => {
            saveAppearanceSettings(formData);
          });
        }}
        className="space-y-6"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              ธีมของแอป (Theme)
            </label>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <input type="radio" name="theme" value="light" defaultChecked={theme === "light"} className="sr-only peer" />
                <div className="w-full h-16 border rounded bg-white peer-checked:border-olive-dark peer-checked:ring-1 peer-checked:ring-olive-dark"></div>
                <span className="text-xs">Light</span>
              </label>
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <input type="radio" name="theme" value="dark" defaultChecked={theme === "dark"} className="sr-only peer" />
                <div className="w-full h-16 border rounded bg-slate-900 peer-checked:border-olive-dark peer-checked:ring-1 peer-checked:ring-olive-dark"></div>
                <span className="text-xs">Dark</span>
              </label>
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <input type="radio" name="theme" value="system" defaultChecked={theme === "system"} className="sr-only peer" />
                <div className="w-full h-16 border rounded bg-gradient-to-br from-white to-slate-900 peer-checked:border-olive-dark peer-checked:ring-1 peer-checked:ring-olive-dark"></div>
                <span className="text-xs">System</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              สีหลัก (Accent Color)
            </label>
            <div className="flex gap-4">
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <input type="radio" name="accent" value="olive" defaultChecked={accent === "olive"} className="sr-only peer" />
                <div className="w-8 h-8 rounded-full bg-[#526042] peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-[#526042]"></div>
                <span className="text-xs">Olive</span>
              </label>
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <input type="radio" name="accent" value="navy" defaultChecked={accent === "navy"} className="sr-only peer" />
                <div className="w-8 h-8 rounded-full bg-blue-900 peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-blue-900"></div>
                <span className="text-xs">Navy</span>
              </label>
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <input type="radio" name="accent" value="monochrome" defaultChecked={accent === "monochrome"} className="sr-only peer" />
                <div className="w-8 h-8 rounded-full bg-slate-800 peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-slate-800"></div>
                <span className="text-xs">Mono</span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-line">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 bg-charcoal text-background hover:bg-olive font-medium text-xs rounded-none transition-colors disabled:opacity-50 inline-flex items-center"
          >
            {isPending ? "กำลังบันทึก..." : "บันทึกการตั้งค่าธีม"}
          </button>
        </div>
      </form>
    </div>
  );
}
