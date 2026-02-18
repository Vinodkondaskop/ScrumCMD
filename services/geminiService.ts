import { GoogleGenAI } from "@google/genai";
import { Employee, Project, Task, Blocker } from "../types";

const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).API_KEY || '';

export interface AnalysisContext {
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  blockers: Blocker[];
}

// ─── Build Rich Data Summary ────────────────────────────────
function buildDataSummary(ctx: AnalysisContext): string {
  const todayStr = new Date().toISOString().split('T')[0];

  // Per-employee breakdown
  const empSummaries = ctx.employees
    .filter(e => e.status === 'Active')
    .map(emp => {
      const empTasks = ctx.tasks.filter(t => t.assignedToId === emp.id);
      const done = empTasks.filter(t => t.status === 'Done').length;
      const inProgress = empTasks.filter(t => t.status === 'In Progress').length;
      const blocked = empTasks.filter(t => t.status === 'Blocked').length;
      const overdue = empTasks.filter(t => t.dueDate < todayStr && t.status !== 'Done').length;
      const todo = empTasks.filter(t => t.status === 'Todo').length;
      return `  - ${emp.name} (${emp.role}): ${empTasks.length} total | ${done} done, ${inProgress} in progress, ${todo} todo, ${blocked} blocked, ${overdue} overdue`;
    }).join('\n');

  // Per-project breakdown
  const projSummaries = ctx.projects.map(proj => {
    const projTasks = ctx.tasks.filter(t => t.projectId === proj.id);
    const done = projTasks.filter(t => t.status === 'Done').length;
    const total = projTasks.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const overdue = projTasks.filter(t => t.dueDate < todayStr && t.status !== 'Done').length;
    return `  - ${proj.name} (${proj.status}): ${pct}% complete (${done}/${total} tasks) | Deadline: ${proj.deadline} | ${overdue} overdue`;
  }).join('\n');

  // Overdue tasks detail
  const overdueTasks = ctx.tasks
    .filter(t => t.dueDate < todayStr && t.status !== 'Done')
    .map(t => {
      const emp = ctx.employees.find(e => e.id === t.assignedToId);
      const daysOver = Math.floor((Date.now() - new Date(t.dueDate).getTime()) / 86400000);
      return `  - "${t.title}" → ${emp?.name || 'Unassigned'} | ${daysOver}d overdue | Priority: ${t.priority}`;
    }).join('\n');

  // Blocked tasks detail
  const blockedTasks = ctx.tasks
    .filter(t => t.status === 'Blocked')
    .map(t => {
      const emp = ctx.employees.find(e => e.id === t.assignedToId);
      return `  - "${t.title}" → ${emp?.name || 'Unassigned'} | Priority: ${t.priority}`;
    }).join('\n');

  // Open blockers
  const openBlockers = ctx.blockers
    .filter(b => b.status === 'Open')
    .map(b => {
      const emp = ctx.employees.find(e => e.id === b.employeeId);
      const daysOpen = Math.floor((Date.now() - new Date(b.reportedDate).getTime()) / 86400000);
      return `  - "${b.description}" — reported by ${emp?.name || 'Unknown'} (${daysOpen}d ago)`;
    }).join('\n');

  return `
TODAY: ${todayStr}

TEAM (${ctx.employees.filter(e => e.status === 'Active').length} active members):
${empSummaries || '  (none)'}

PROJECTS (${ctx.projects.length} total):
${projSummaries || '  (none)'}

OVERDUE TASKS (${ctx.tasks.filter(t => t.dueDate < todayStr && t.status !== 'Done').length}):
${overdueTasks || '  None — all on track!'}

BLOCKED TASKS (${ctx.tasks.filter(t => t.status === 'Blocked').length}):
${blockedTasks || '  None'}

OPEN BLOCKERS (${ctx.blockers.filter(b => b.status === 'Open').length}):
${openBlockers || '  None'}

TASK SUMMARY:
  Total: ${ctx.tasks.length} | Done: ${ctx.tasks.filter(t => t.status === 'Done').length} | In Progress: ${ctx.tasks.filter(t => t.status === 'In Progress').length} | Todo: ${ctx.tasks.filter(t => t.status === 'Todo').length} | Blocked: ${ctx.tasks.filter(t => t.status === 'Blocked').length}
  `.trim();
}

// ─── Prompt Templates ───────────────────────────────────────
export type PromptType = 'sprint_health' | 'risk_report' | 'standup_notes' | 'workload_check';

const PROMPT_TEMPLATES: Record<PromptType, string> = {
  sprint_health: `You are an expert Agile Scrum Master. Based on the team data below, generate a **Sprint Health Report** in Markdown.

Include:
1. **Overall Health Score** — rate 0-100 with a one-line justification
2. **Progress Summary** — how each project is tracking against its deadline
3. **Key Wins** — what's going well (tasks completed, blockers resolved)
4. **Concerns** — overdue items, blocked work, capacity issues
5. **Action Items** — 3-5 specific, actionable recommendations

Keep it concise and actionable. Use bullet points. No fluff.`,

  risk_report: `You are a risk analyst for a software team. Based on the data below, generate a **Risk Assessment Report** in Markdown.

Include:
1. **🔴 Critical Risks** — projects/tasks that need immediate attention (overdue, blocked, near-deadline with low completion)
2. **🟡 Warnings** — potential issues that could escalate  
3. **🟢 On Track** — things going well
4. **Mitigation Plan** — specific actions to address each critical risk

Prioritize by severity. Be direct and specific — name the people, projects, and tasks.`,

  standup_notes: `You are a Scrum Master generating today's standup summary. Based on the team data below, create a **Daily Standup Notes** document in Markdown.

Format it as:
1. **📋 Team Overview** — quick 1-line status
2. **Per-Person Update** — for each active team member, summarize:
   - What they're working on (In Progress tasks)
   - What's blocked (Blocked tasks)
   - What's overdue
3. **🚨 Items Needing Attention** — anything the PM should act on today
4. **Today's Priorities** — what the team should focus on

Keep each person's section to 2-3 lines max.`,

  workload_check: `You are a resource manager. Based on the team data below, generate a **Workload Distribution Analysis** in Markdown.

Include:
1. **Workload Heatmap** — rank team members from most to least loaded (use task counts + priority weighting)
2. **🔥 Overloaded** — who has too much on their plate
3. **💤 Available Capacity** — who could take on more work
4. **Rebalancing Suggestions** — specific task reassignment recommendations
5. **Capacity Planning Note** — can the team handle more work?

Be specific — name tasks that could be reassigned and suggest who should take them.`
};

// ─── Main Analysis Function ─────────────────────────────────
export const analyzeTeamPerformance = async (
  context: AnalysisContext,
  promptType: PromptType = 'sprint_health'
): Promise<string> => {
  if (!GEMINI_API_KEY) {
    return "⚠️ **API Key Missing**\n\nPlease configure `VITE_GEMINI_API_KEY` in your `.env` file to use AI features.";
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const dataSummary = buildDataSummary(context);
  const systemPrompt = PROMPT_TEMPLATES[promptType];

  const prompt = `${systemPrompt}\n\n---\n\n**TEAM DATA:**\n\n${dataSummary}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: prompt,
    });
    return response.text || "Analysis complete, but no text returned.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "❌ **Failed to generate analysis.** Please check your API key and try again.";
  }
};
