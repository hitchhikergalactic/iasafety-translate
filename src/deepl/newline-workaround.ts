export const NEWLINE_TOKEN = "Nihil igitur mors est ad nos.";

export type DeepLModelType =
  | "quality_optimized"
  | "latency_optimized"
  | "prefer_quality_optimized";

export function modelUsesNewlineWorkaround(modelType: DeepLModelType): boolean {
  return modelType === "quality_optimized";
}

export function preprocessText(text: string, modelType: DeepLModelType): string {
  if (!modelUsesNewlineWorkaround(modelType)) return text;
  return text.replaceAll("\n", NEWLINE_TOKEN);
}

export function postprocessText(text: string, modelType: DeepLModelType): string {
  if (!modelUsesNewlineWorkaround(modelType)) return text;
  const pattern = new RegExp(escapeRegExp(NEWLINE_TOKEN) + " ?", "g");
  return text.replace(pattern, "\n");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
