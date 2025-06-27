import { apiRequest } from "./queryClient";

export async function translateText(text: string, from: string = "en", to: string = "ta"): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/translate", {
      text,
      from,
      to,
    });
    
    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text if translation fails
  }
}
