import Anthropic from "@anthropic-ai/sdk";

export interface TranslationResult {
  original: string;
  nameDe: string;
  nameEn: string;
  nameSl: string;
}

export interface NewsTranslationResult {
  original: string;
  english: string;
}

export class TranslationService {
  private static anthropic: Anthropic | null = null;

  private static getClient(): Anthropic {
    if (!this.anthropic) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    return this.anthropic;
  }

  private static getModel(): string {
    return process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";
  }

  /**
   * Send a prompt to Claude and return the text of the response
   */
  private static async complete(
    client: Anthropic,
    system: string,
    prompt: string
  ): Promise<string> {
    const response = await client.messages.create({
      model: this.getModel(),
      // Thinking-Tokens zählen mit, darum mehr Luft als die früheren 4000
      max_tokens: 16000,
      output_config: { effort: "low" },
      system,
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal") {
      throw new Error("Claude refused the translation request");
    }
    if (response.stop_reason === "max_tokens") {
      throw new Error("Translation response was cut off (max_tokens)");
    }

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
    if (!content) {
      throw new Error("No response from Claude");
    }
    return content;
  }

  /**
   * Parse a JSON array from the model output (tolerates code fences or surrounding text)
   */
  private static parseJsonArray<T>(content: string): T[] {
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      // fall through to extraction
    }
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) return parsed as T[];
    }
    throw new Error("Failed to parse translation response");
  }

  /**
   * Translate a batch of location names using Claude
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
    client: Anthropic,
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

    const content = await this.complete(
      client,
      "You are a professional translator specializing in geographic location names. Return only valid JSON arrays.",
      prompt
    );

    return this.parseJsonArray<TranslationResult>(content);
  }

  /**
   * Translate news content from German to English using Claude
   * Optimized for longer text like news titles and content
   */
  static async translateNewsContent(texts: string[]): Promise<NewsTranslationResult[]> {
    if (texts.length === 0) return [];

    const client = this.getClient();

    const prompt = `Translate the following German texts to English.
These are news announcements and titles for a geography quiz game called "GeoMaster".

Input texts (JSON array):
${JSON.stringify(texts)}

Return a JSON array with objects containing:
- original: the original German text
- english: the English translation

Important rules:
1. Keep the tone friendly and engaging
2. Keep product names like "GeoMaster" unchanged
3. Translate naturally, not word-by-word
4. Keep emojis if present

Return ONLY valid JSON, no markdown or explanation.`;

    const content = await this.complete(
      client,
      "You are a professional translator. Translate German to English naturally. Return only valid JSON arrays.",
      prompt
    );

    return this.parseJsonArray<NewsTranslationResult>(content);
  }
}
