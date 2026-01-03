import OpenAI from "openai";

export interface TranslationResult {
  original: string;
  nameDe: string;
  nameEn: string;
  nameSl: string;
}

export class TranslationService {
  private static openai: OpenAI | null = null;

  private static getClient(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  /**
   * Translate a batch of location names using GPT-4o-mini
   * Batching reduces API calls and costs
   */
  static async translateBatch(names: string[]): Promise<TranslationResult[]> {
    if (names.length === 0) return [];

    const client = this.getClient();

    // Batch up to 50 names per request to stay within token limits
    const BATCH_SIZE = 50;
    const results: TranslationResult[] = [];

    for (let i = 0; i < names.length; i += BATCH_SIZE) {
      const batch = names.slice(i, i + BATCH_SIZE);
      const batchResults = await this.translateSingleBatch(client, batch);
      results.push(...batchResults);
    }

    return results;
  }

  private static async translateSingleBatch(
    client: OpenAI,
    names: string[]
  ): Promise<TranslationResult[]> {
    const prompt = `Translate the following location names into German (de), English (en), and Slovenian (sl).
These are geographic locations (cities, mountains, landmarks, etc.).

Input locations (JSON array):
${JSON.stringify(names)}

Return a JSON array with objects containing:
- original: the original name
- nameDe: German translation (if already German, keep as-is)
- nameEn: English translation (if already English, keep as-is)
- nameSl: Slovenian translation

Important rules:
1. Keep proper nouns recognizable (e.g., "Zürich" stays "Zürich" in all languages)
2. Translate descriptive parts (e.g., "Hauptbahnhof" -> "Main Station" in English)
3. For well-known places, use the commonly accepted translation
4. If no translation exists, use the original name

Return ONLY valid JSON, no markdown or explanation.`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator specializing in geographic location names. Return only valid JSON arrays.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent translations
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      return parsed as TranslationResult[];
    } catch {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as TranslationResult[];
      }
      throw new Error("Failed to parse translation response");
    }
  }
}
