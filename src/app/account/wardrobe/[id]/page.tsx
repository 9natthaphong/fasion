import { notFound } from "next/navigation";
import { requireCustomerExperiencePage } from "@/lib/auth";
import { getWardrobeItem } from "@/lib/wardrobe";
import { EditItemForm } from "@/components/wardrobe/edit-item-form";
import { Shirt } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WardrobeItemDetailPage({ params }: PageProps) {
  const user = await requireCustomerExperiencePage("/login/customer");
  const { id } = await params;

  const item = await getWardrobeItem(id, user.id);
  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-line pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-muted uppercase">
          <Shirt className="w-4 h-4 text-olive" />
          <span>Wardrobe Item Detail</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal mt-1">
          {item.name || "เสื้อผ้าส่วนตัว"}
        </h1>
        <p className="text-sm text-muted mt-1">
          ตรวจสอบและแก้ไขข้อมูลเสื้อผ้าเพื่อการแนะนำที่แม่นยำยิ่งขึ้น
        </p>
      </div>

      {/* Edit Form */}
      <EditItemForm item={item} />
    </div>
  );
}
