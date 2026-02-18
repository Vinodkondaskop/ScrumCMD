import { GoogleGenAI } from "@google/genai";
import { Employee, Project, Task, DailyUpdate, Blocker } from "../types";

const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).API_KEY || '';

interface AnalysisContext {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  recentUpdates: DailyUpdate[];
  blockers: Blocker[];
}

export const analyzeTeamPerformance = async (context: AnalysisContext): Promise<string> => {
  if (!GEMINI_API_KEY) {
    return "API Key is missing. Please configure VITE_GEMINI_API_KEY in .env.";
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Prepare a concise summary for the model
  const prompt = `
    You are an expert Agile Scrum Master and Project Manager. Analyze the following team data and provide a "Project Velocity & Health Report".
    
    Focus on:
    1. Identifying employees who are consistently blocked or underperforming.
    2. Spotting projects at risk based on deadlines and task completion.
    3. Suggesting specific actions to resolve the oldest open blockers.
    4. Provide a "Team Efficiency Score" out of 100 with justification.

    Format the output as clean Markdown.

    Data:
    - Active Employees: ${context.employees.length}
    - Active Projects: ${context.projects.length}
    - Open Tasks: ${context.tasks.filter(t => t.status !== 'Done').length}
    - Recent Blockers: ${JSON.stringify(context.blockers.slice(0, 5))}
    - Recent Daily Updates (Sample): ${JSON.stringify(context.recentUpdates.slice(0, 5).map(u => ({
    task: u.taskTitle,
    progress: u.progress,
    yesterday: u.yesterday,
    today: u.today,
    blocker: u.blockers
  })))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Analysis complete, but no text returned.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate analysis. Please try again later.";
  }
};
