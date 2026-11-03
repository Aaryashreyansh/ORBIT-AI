import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type PlanStep = {
  step_key: string;
  step_type: string;
  title: string;
  description: string;
  position: number;
  input: Record<string, unknown>;
};

function buildPlan(prompt: string): PlanStep[] {
  const normalized = prompt.toLowerCase();
  const research = /research|study|find|compare|analy[sz]e|investigat|जानकारी|रिसर्च|तुलना|विश्लेषण/.test(normalized);
  const create = /write|draft|create|build|make|prepare|बनाओ|तैयार|लिखो/.test(normalized);
  const organize = /plan|organize|schedule|priorit|योजना|प्लान|व्यवस्थित/.test(normalized);

  const intent = research ? "research_and_analysis" : create ? "creation" : organize ? "planning" : "general_task";
  const steps: Omit<PlanStep, "position">[] = [
    {
      step_key: "understand_goal",
      step_type: "goal_analysis",
      title: "Understand the goal",
      description: "Extract the requested outcome, constraints, and expected deliverable.",
      input: { prompt, detected_intent: intent }
    },
    {
      step_key: "build_plan",
      step_type: "plan_generation",
      title: "Build an actionable plan",
      description: research
        ? "Break the research into question framing, evidence gathering, comparison, and synthesis."
        : create
          ? "Break the creation task into requirements, preparation, production, and review."
          : "Break the request into preparation, focused work, and a final review.",
      input: { stages: research ? ["Frame the question", "Identify reliable evidence", "Compare findings", "Synthesize the result"] : create ? ["Confirm requirements", "Prepare inputs", "Create the deliverable", "Review the result"] : ["Clarify the outcome", "List required actions", "Complete safe internal work", "Review completion"] }
    },
    {
      step_key: "safety_review",
      step_type: "policy_check",
      title: "Check execution boundaries",
      description: "Identify external, irreversible, or sensitive actions that must wait for explicit approval.",
      input: { external_actions_allowed: false, approval_required_for_external_actions: true }
    },
    {
      step_key: "execution_passport",
      step_type: "passport",
      title: "Create execution passport",
      description: "Record the plan, safe execution boundary, and current outcome.",
      input: { evidence_level: "planning_only", external_actions_performed: false }
    }
  ];
  return steps.map((step, position) => ({ ...step, position }));
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Database connection is not configured." }, { status: 503 });

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: "Your session is invalid. Please sign in again." }, { status: 401 });

  let body: { prompt?: string; workspaceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request is required." }, { status: 400 });
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId : "";
  if (!prompt || prompt.length > 2000 || !workspaceId) {
    return NextResponse.json({ error: "Enter a task (up to 2,000 characters) and select a workspace." }, { status: 400 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (membershipError || !membership) return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });

  const steps = buildPlan(prompt);
  const title = prompt.replace(/\s+/g, " ").slice(0, 160);
  const { data: workflow, error: workflowError } = await supabase
    .from("workflows")
    .insert({
      workspace_id: workspaceId,
      name: title,
      description: "Plan generated. No external actions were performed.",
      definition: {
        version: 1,
        engine: "orbit-rule-planner-v1",
        mode: "safe_planning",
        prompt,
        intent: steps[0].input.detected_intent,
        steps,
        execution_requires_approval: true
      },
      status: "draft"
    })
    .select("id,name,status,description")
    .single();

  if (workflowError || !workflow) return NextResponse.json({ error: workflowError?.message || "Could not save the workflow." }, { status: 500 });

  const { data: run, error: runError } = await supabase
    .from("workflow_runs")
    .insert({
      workflow_id: workflow.id,
      status: "planning",
      input: { prompt, engine: "orbit-rule-planner-v1" },
      started_at: new Date().toISOString()
    })
    .select("id,status,created_at")
    .single();

  if (runError || !run) {
    return NextResponse.json({ error: runError?.message || "Workflow was saved, but its run could not be created.", workflow }, { status: 500 });
  }

  const stepRows = steps.map((step) => ({
    run_id: run.id,
    step_key: step.step_key,
    step_type: step.step_type,
    status: "succeeded",
    input: { title: step.title, description: step.description, ...step.input },
    output: { result: step.description, completed_by: "safe_planning_engine" },
    position: step.position,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString()
  }));
  const { data: savedSteps, error: stepsError } = await supabase
    .from("workflow_steps")
    .insert(stepRows)
    .select("id,step_key,step_type,status,input,output,position");

  if (stepsError) {
    await supabase.from("workflow_runs").update({ status: "failed", error: { message: stepsError.message }, completed_at: new Date().toISOString() }).eq("id", run.id);
    return NextResponse.json({ error: "The run started, but its steps could not be recorded.", workflow, runId: run.id }, { status: 500 });
  }

  const passport = {
    run_id: run.id,
    workflow_id: workflow.id,
    engine: "orbit-rule-planner-v1",
    outcome: "plan_created",
    evidence_level: "planning_only",
    steps_completed: savedSteps?.length || 0,
    external_actions_performed: false,
    approval_required_before_external_actions: true,
    created_at: new Date().toISOString()
  };

  const { error: eventError } = await supabase.from("execution_events").insert([
    { run_id: run.id, event_type: "plan.generated", event_data: { workflow_id: workflow.id, intent: steps[0].input.detected_intent } },
    { run_id: run.id, event_type: "run.completed", event_data: passport }
  ]);

  if (eventError) {
    await supabase.from("workflow_runs").update({ status: "failed", error: { message: eventError.message }, completed_at: new Date().toISOString() }).eq("id", run.id);
    return NextResponse.json({ error: "The plan was created, but the execution record could not be completed.", workflow, runId: run.id }, { status: 500 });
  }

  const { error: finishError } = await supabase
    .from("workflow_runs")
    .update({ status: "succeeded", output: passport, completed_at: new Date().toISOString() })
    .eq("id", run.id);
  if (finishError) return NextResponse.json({ error: "The plan was saved, but the run status could not be finalized.", workflow, runId: run.id }, { status: 500 });

  return NextResponse.json({
    workflow,
    run: { ...run, status: "succeeded" },
    steps: savedSteps || [],
    passport,
    engine: { name: "ORBIT Safe Planner", mode: "rule-based", note: "An LLM provider is not configured yet; this version generates structured plans without claiming external task completion." }
  });
}
