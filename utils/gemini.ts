
import { GoogleGenAI } from "@google/genai";
import { CalculatedResult, ClassLevel } from "../types";

// Safe helper to get the AI instance only if the key exists
const getAI = () => {
  try {
    const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    return null;
  }
};

export const generateClassInsights = async (results: CalculatedResult[], classLevel: ClassLevel) => {
  const ai = getAI();
  if (!ai || results.length === 0) return "AI Insights unavailable. Ensure API key is configured.";

  const summaryData = results.map(r => ({
    name: r.name,
    percentage: r.percentage,
    status: r.status,
    marks: r.marks
  }));

  const prompt = `Analyze the academic results for Class ${classLevel} and provide a 3-bullet point strategic summary. 
  Focus on: Overall trend, strongest/weakest subjects, and one piece of advice.
  Data: ${JSON.stringify(summaryData.slice(0, 15))}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI is currently busy. Please try again later.";
  }
};

export const generateStudentRemarks = async (student: CalculatedResult) => {
  const ai = getAI();
  if (!ai) return "Keep up the effort!";

  const prompt = `Write a 15-word encouraging remark for ${student.name} (${student.percentage}%). Mention a specific subject strength from: ${JSON.stringify(student.marks)}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Great work this term! Continue focusing on your studies.";
  }
};
