"use client";

import { useState } from "react";

interface ProfileFormProps {
  initial: {
    displayName: string;
    heightCm: number | null;
    weightKg: number | null;
    clothingPresentation: string;
    preferredFit: string;
    defaultBudget: number | null;
    preferredStyles: string[];
    preferredColors: string[];
    avoidedColors: string[];
    saveBodyInformation: boolean;
  };
}

export function ProfileForm({ initial }: ProfileFormProps) {
  const [state, setState] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setPending(false);
    if (!response.ok) setError(data.error ?? "บันทึกไม่สำเร็จ");
    else setMessage(data.message ?? "บันทึกแล้ว");
  };

  const csv = (values: string[]) => values.join(", ");
  const parseCsv = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);

  return (
    <form className="form-stack content-card" onSubmit={save}>
      <label>
        ชื่อที่แสดง
        <input
          value={state.displayName}
          onChange={(event) => setState({ ...state, displayName: event.target.value })}
          required
          minLength={2}
          maxLength={100}
        />
      </label>
      <div className="form-grid">
        <label>
          แนวเสื้อผ้า
          <select
            value={state.clothingPresentation}
            onChange={(event) =>
              setState({ ...state, clothingPresentation: event.target.value })
            }
          >
            <option value="unspecified">ไม่ระบุ</option>
            <option value="menswear">ผู้ชาย</option>
            <option value="womenswear">ผู้หญิง</option>
            <option value="unisex">Unisex</option>
          </select>
        </label>
        <label>
          ทรงที่ชอบ
          <select
            value={state.preferredFit}
            onChange={(event) => setState({ ...state, preferredFit: event.target.value })}
          >
            <option value="unspecified">ไม่ระบุ</option>
            <option value="fitted">พอดีตัว</option>
            <option value="relaxed">หลวม</option>
          </select>
        </label>
      </div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={state.saveBodyInformation}
          onChange={(event) =>
            setState({
              ...state,
              saveBodyInformation: event.target.checked,
              heightCm: event.target.checked ? state.heightCm : null,
              weightKg: event.target.checked ? state.weightKg : null,
            })
          }
        />
        <span>บันทึกส่วนสูงและน้ำหนักไว้ใช้ครั้งหน้า</span>
      </label>
      <div className="form-grid">
        <label>
          ส่วนสูง (ซม.)
          <input
            type="number"
            min={80}
            max={260}
            disabled={!state.saveBodyInformation}
            value={state.heightCm ?? ""}
            onChange={(event) =>
              setState({
                ...state,
                heightCm: event.target.value ? Number(event.target.value) : null,
              })
            }
          />
        </label>
        <label>
          น้ำหนัก (กก.)
          <input
            type="number"
            min={20}
            max={350}
            disabled={!state.saveBodyInformation}
            value={state.weightKg ?? ""}
            onChange={(event) =>
              setState({
                ...state,
                weightKg: event.target.value ? Number(event.target.value) : null,
              })
            }
          />
        </label>
      </div>
      <label>
        สไตล์ที่ชอบ (คั่นด้วยจุลภาค)
        <input
          value={csv(state.preferredStyles)}
          onChange={(event) =>
            setState({ ...state, preferredStyles: parseCsv(event.target.value) })
          }
        />
      </label>
      <div className="form-grid">
        <label>
          สีที่ชอบ
          <input
            value={csv(state.preferredColors)}
            onChange={(event) =>
              setState({ ...state, preferredColors: parseCsv(event.target.value) })
            }
          />
        </label>
        <label>
          สีที่ไม่ต้องการ
          <input
            value={csv(state.avoidedColors)}
            onChange={(event) =>
              setState({ ...state, avoidedColors: parseCsv(event.target.value) })
            }
          />
        </label>
      </div>
      <label>
        งบประมาณปกติ (บาท)
        <input
          type="number"
          min={0}
          value={state.defaultBudget ?? ""}
          onChange={(event) =>
            setState({
              ...state,
              defaultBudget: event.target.value ? Number(event.target.value) : null,
            })
          }
        />
      </label>
      {error ? <div className="alert alert-error">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}
      <button className="button button-solid" type="submit" disabled={pending}>
        {pending ? "กำลังบันทึก…" : "บันทึกโปรไฟล์"}
      </button>
    </form>
  );
}

