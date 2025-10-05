
import { GoogleGenAI } from "@google/genai";

export const generateInsult = async (): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      // Fallback for environments where API_KEY is not set
      console.warn("API_KEY not found. Using fallback insult.");
      const fallbacks = [
        "Is that the best you can do?",
        "My knitting is more exciting than this!",
        "You fly like my grandson plays games... badly!",
        "Hmph. In my day, we had REAL challenges.",
        "You should try using the controller with your hands!",
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a short, savage, and funny insult that a pro-gamer grandma might roast a newbie with. 
        Make it one witty sentence. Keep it family-friendly but with a sharp edge.
        For example: "You have the reaction time of a dial-up modem!" or "My cat could dodge better than that."`,
        config: {
            temperature: 0.9,
            topP: 1,
            topK: 1,
        }
    });

    // Fix: Access .text as a property to get the string response.
    return response.text;
  } catch (error) {
    console.error("Error generating insult:", error);
    return "I'm too tired to think of a good insult.";
  }
};