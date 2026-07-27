export interface StylistPromptContext {
  activity: string;
  formality?: string;
  weather?: string;
  timeOfDay?: string;
  preferredStyles?: string[];
  preferredColors?: string[];
  avoidedColors?: string[];
  notes?: string;
  feedbackSummary?: string | null;
  fitProfileOptions?: Record<string, unknown>;
}

export function buildStylistPrompt(context: StylistPromptContext): string {
  // Pure function: receives context, outputs prompt string with zero ad/merchant data
  const safeContext = {
    activity: context.activity,
    formality: context.formality || "casual",
    weather: context.weather || "general",
    timeOfDay: context.timeOfDay || "day",
    preferredStyles: context.preferredStyles || [],
    preferredColors: context.preferredColors || [],
    avoidedColors: context.avoidedColors || [],
    notes: context.notes || null,
    feedbackSummary: context.feedbackSummary || null,
    fitProfileOptions: context.fitProfileOptions || {},
  };

  return `สร้างคำแนะนำจัดชุด 3 ทิศทาง (safe, elevated, comfortable) จากข้อมูลต่อไปนี้:\n${JSON.stringify(safeContext)}`;
}
