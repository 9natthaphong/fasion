"use client";

import { useState } from "react";
import { CloudSun, MapPin, Loader2 } from "lucide-react";
import { fetchCurrentWeather } from "@/lib/weather";

interface Props {
  onSelectWeather: (weatherText: string) => void;
}

export function WeatherWidget({ onSelectWeather }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [weatherDesc, setWeatherDesc] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGetLocationWeather = () => {
    if (!navigator.geolocation) {
      setErrorMsg("เบราว์เซอร์ไม่รองรับการดึงตำแหน่ง");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const info = await fetchCurrentWeather(latitude, longitude);
        setIsLoading(false);

        if (info) {
          setWeatherDesc(info.description);
          onSelectWeather(info.description);
        } else {
          setErrorMsg("ไม่สามารถดึงสภาพอากาศได้ กรุณากรอบพิมพ์ด้วยตนเอง");
        }
      },
      (err) => {
        setIsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg("สิทธิ์ตำแหน่งถูกปฏิเสธ สามารถพิมพ์ระบุสภาพอากาศได้ตามปกติ");
        } else {
          setErrorMsg("ดึงตำแหน่งไม่สำเร็จ สามารถพิมพ์ระบุด้วยตนเองได้");
        }
      },
      { timeout: 8000 },
    );
  };

  return (
    <div className="space-y-2 pt-2">
      <button
        type="button"
        onClick={handleGetLocationWeather}
        disabled={isLoading}
        className="px-3 py-1.5 border border-line bg-paper text-charcoal hover:border-charcoal text-xs font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <MapPin className="w-3.5 h-3.5 text-olive" />
        )}
        <span>ดึงสภาพอากาศจากตำแหน่งปัจจุบัน (Open-Meteo)</span>
      </button>

      {weatherDesc && (
        <div className="text-xs text-olive font-medium flex items-center gap-1.5 pt-1">
          <CloudSun className="w-4 h-4 shrink-0" />
          <span>{weatherDesc}</span>
        </div>
      )}

      {errorMsg && (
        <p className="text-[11px] text-muted italic">{errorMsg}</p>
      )}
    </div>
  );
}
