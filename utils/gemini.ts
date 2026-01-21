
import { GoogleGenAI } from "@google/genai";
import { CalculatedResult, ClassLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateClassInsights = async (results: CalculatedResult[], classLevel: ClassLevel) => {
  if (results.length === 0) return "No data available for analysis.";

  const summaryData = results.map(r => ({
    name: r.name,
    percentage: r.percentage,
    status: r.status,
    marks: r.marks
  }));

  const prompt = `Analyze the following academic results for Class ${classLevel} and provide a concise strategic summary (3-4 bullet points). 
  Identify:
  1. Overall class performance trend.
  2. Subjects that seem to be the strongest/weakest based on the marks.
  3. Actionable advice for teachers to improve results.
  
  Data: ${JSON.stringify(summaryData.slice(0, 15))} (Analysis limited to top 15 students for brevity)`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate AI insights at this time.";
  }
};

export const generateStudentRemarks = async (student: CalculatedResult) => {
  const prompt = `Write a personalized, encouraging, and professional one-sentence academic remark for a student named ${student.name} who achieved a ${student.percentage}% and is ranked ${student.rank}. 
  Their marks are: ${JSON.stringify(student.marks)}. 
  Mention a specific strength or area for improvement based on their marks. Keep it under 20 words.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Keep up the hard work!";
  }
};
