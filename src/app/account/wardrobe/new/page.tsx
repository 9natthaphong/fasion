import { requirePageRole } from "@/lib/auth";
import { AddItemForm } from "@/components/wardrobe/add-item-form";
import { Shirt } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewWardrobeItemPage() {
  await requirePageRole(["customer"], "/login/customer");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-line pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-muted uppercase">
          <Shirt className="w-4 h-4 text-olive" />
          <span>Add Wardrobe Item</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal mt-1">
          เพิ่มเสื้อผ้าเข้าตู้ส่วนตัว
        </h1>
        <p className="text-sm text-muted mt-1">
          ถ่ายรูปหรืออัปโหลดรูปภาพเสื้อผ้าของคุณ AI Vision จะช่วยอ่านลักษณะและประเภทเสื้อผ้าให้อัตโนมัติ
        </p>
      </div>

      {/* Add Item Form */}
      <AddItemForm />
    </div>
  );
}
