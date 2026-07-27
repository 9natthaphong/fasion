export interface WeatherInfo {
  temperatureC: number;
  weatherText: string;
  description: string;
}

const weatherCodeMap: Record<number, string> = {
  0: "ท้องฟ้าโปร่ง แจ่มใส",
  1: "มีแดดจัด ท้องฟ้าโปร่งเป็นส่วนใหญ่",
  2: "มีเมฆบางส่วน",
  3: "มีเมฆมาก",
  45: "มีหมอกหนา",
  48: "มีหมอกลงจัด",
  51: "มีฝนตกปรอยๆ เล็กน้อย",
  53: "มีฝนตกปานกลาง",
  55: "มีฝนตกหนัก",
  61: "มีฝนตกเป็นละออง",
  63: "มีฝนตกปานกลาง",
  65: "มีฝนตกหนักมาก",
  80: "มีฝนซาๆ เป็นช่วงๆ",
  81: "มีฝนตกชุก",
  82: "มีฝนตกหนักรุนแรง",
  95: "มีพายุฝนฟ้าคะนอง",
};

export async function fetchCurrentWeather(lat: number, lon: number): Promise<WeatherInfo | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;

    const data = await res.json();
    const current = data.current_weather;
    if (!current) return null;

    const temp = Math.round(current.temperature);
    const code = current.weathercode ?? 0;
    const weatherText = weatherCodeMap[code] || "อากาศทั่วไป";

    let tempContext = "อบอุ่น/สบาย";
    if (temp >= 33) tempContext = "อากาศร้อนจัด";
    else if (temp >= 28) tempContext = "อากาศร้อนชื้น";
    else if (temp <= 22) tempContext = "อากาศเย็นสบาย";

    const description = `${temp}°C ${tempContext} (${weatherText})`;

    return {
      temperatureC: temp,
      weatherText,
      description,
    };
  } catch (err) {
    console.warn("Open-Meteo weather lookup failed, falling back to manual entry:", err);
    return null;
  }
}
