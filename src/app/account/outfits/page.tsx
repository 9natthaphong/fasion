import { EmptyState } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function OutfitHistoryPage() {
  const user = await requirePageRole(["customer"], "/login/customer");
  const supabase = await createClient();
  const { data } = await supabase
    .from("outfit_requests")
    .select("id, created_at, input_data, outfit_results(id, model_name, result_data)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (
    <>
      <header className="dashboard-heading">
        <p className="eyebrow">AI history</p>
        <h1>ประวัติ AI Stylist</h1>
        <p>ลบคำแนะนำที่ไม่ต้องการเก็บได้โดยไม่กระทบโปรไฟล์</p>
      </header>
      {!data?.length ? (
        <EmptyState
          title="ยังไม่มีประวัติ"
          body="เมื่อใช้ AI Stylist ขณะเข้าสู่ระบบ ผลลัพธ์จะปรากฏที่นี่"
          href="/ai-stylist"
          action="เลือกชุดแรก"
        />
      ) : (
        <div className="history-list">
          {data.map((item) => {
            const result = Array.isArray(item.outfit_results)
              ? item.outfit_results[0]
              : item.outfit_results;
            const resultData = result?.result_data as
              | { summary?: string; outfits?: { name?: string }[] }
              | undefined;
            const input = item.input_data as { activity?: string };
            return (
              <article className="content-card history-row" key={item.id}>
                <div>
                  <span>{formatDate(item.created_at)}</span>
                  <h2>{input.activity ?? "คำแนะนำการแต่งตัว"}</h2>
                  <p>{resultData?.summary}</p>
                  <small>
                    {resultData?.outfits?.map((outfit) => outfit.name).filter(Boolean).join(" · ")}
                  </small>
                </div>
                <form action={`/api/account/outfits/${item.id}`} method="post">
                  <input type="hidden" name="_method" value="DELETE" />
                  <button className="button button-danger" type="submit">
                    ลบ
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

