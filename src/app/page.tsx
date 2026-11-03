"use client";

import { useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, Check, ChevronDown, CircleHelp, Command,
  FileText, GitBranch, Layers3, Plus, Search, Send, Settings2,
  ShieldCheck, Sparkles, Workflow, Zap
} from "lucide-react";

type Run = { id: number; title: string; status: "Verified" | "Needs approval" | "Draft"; detail: string };

const starterRuns: Run[] = [
  { id: 1, title: "Prepare a project launch checklist", status: "Verified", detail: "Plan created · 6 steps checked" },
  { id: 2, title: "Summarize my workspace activity", status: "Verified", detail: "Local demo · no external actions" },
  { id: 3, title: "Connect a new integration", status: "Needs approval", detail: "Waiting for your permission" }
];

const suggestions = [
  "Plan my week and organize priorities",
  "Turn a goal into an actionable project",
  "Review a workflow before I run it"
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [runs, setRuns] = useState(starterRuns);
  const [activeNav, setActiveNav] = useState("Overview");
  const [notice, setNotice] = useState("Demo mode · connect Supabase to enable your private workspace");
  const [query, setQuery] = useState("");

  const visibleRuns = useMemo(
    () => runs.filter((run) => run.title.toLowerCase().includes(query.toLowerCase())),
    [runs, query]
  );

  function createRun(value = prompt) {
    const clean = value.trim();
    if (!clean) return;
    setRuns((current) => [
      { id: Date.now(), title: clean, status: "Draft", detail: "Draft created · review the plan before execution" },
      ...current
    ]);
    setPrompt("");
    setNotice("Draft created. ORBIT will require your approval before any external action.");
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 px-5 py-7 md:flex md:flex-col">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-indigo-300/30 bg-indigo-400/10 text-indigo-200 shadow-glow"><Command size={21}/></div>
            <div><div className="text-lg font-semibold tracking-[.18em]">ORBIT</div><div className="text-[10px] tracking-[.28em] text-slate-500">AI WORKSPACE</div></div>
          </div>
          <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.22em] text-slate-600">Workspace</div>
          <nav className="space-y-1">
            {[
              ["Overview", Layers3], ["Workflows", Workflow], ["Projects", GitBranch], ["Activity", Activity]
            ].map(([label, Icon]) => (
              <button key={label as string} onClick={() => setActiveNav(label as string)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${activeNav === label ? "bg-indigo-400/10 text-indigo-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                <Icon size={17}/>{label as string}
              </button>
            ))}
          </nav>
          <div className="mb-3 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[.22em] text-slate-600">Manage</div>
          <button onClick={() => setActiveNav("Integrations")} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5"><Zap size={17}/>Integrations</button>
          <button onClick={() => setActiveNav("Settings")} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5"><Settings2 size={17}/>Settings</button>
          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-200"><ShieldCheck size={15} className="text-cyan-300"/>Execution safety</div>
            <p className="text-xs leading-5 text-slate-500">External actions stay behind approval. Every run gets an evidence trail.</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-12">
          <header className="flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3 md:hidden"><div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-400/10 text-indigo-200"><Command size={19}/></div><span className="font-semibold tracking-[.18em]">ORBIT</span></div>
            <div className="hidden text-sm text-slate-500 md:block">Workspace <span className="mx-2 text-slate-700">/</span><span className="text-slate-300">{activeNav}</span></div>
            <div className="flex items-center gap-3"><span className="hidden rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 text-[11px] text-cyan-200 sm:inline-flex">● Systems operational</span><button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-xs text-slate-300">My workspace <ChevronDown size={14}/></button><div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-indigo-300 to-cyan-200 text-xs font-bold text-slate-950">A</div></div>
          </header>

          <div className="mx-auto max-w-5xl">
            <div className="pb-8 pt-12 sm:pt-16">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/[.06] px-3 py-1.5 text-[11px] text-indigo-200"><Sparkles size={13}/> INTELLIGENCE, WITH EXECUTION CONTROL</div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl">Make your next move.<br/><span className="bg-gradient-to-r from-indigo-200 via-violet-200 to-cyan-200 bg-clip-text text-transparent">ORBIT handles the workflow.</span></h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">Describe the outcome. ORBIT turns it into a plan, keeps you in control, and tracks what actually happened.</p>
            </div>

            <div className="rounded-3xl border border-indigo-200/20 bg-[#11182a]/90 p-3 shadow-glow sm:p-4">
              <div className="mb-3 flex items-center justify-between px-2 pt-1"><span className="text-xs font-medium text-slate-300">What would you like to get done?</span><span className="text-[10px] text-slate-600">ENTER TO CREATE A DRAFT</span></div>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); createRun(); } }} placeholder="e.g. Research a topic, compare options, and prepare a decision brief..." className="min-h-28 w-full resize-y bg-transparent px-2 py-2 text-sm leading-6 text-white outline-none placeholder:text-slate-600"/>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[.07] px-2 pt-3"><div className="flex items-center gap-2 text-[11px] text-slate-500"><ShieldCheck size={14} className="text-cyan-300"/> Nothing external runs without approval</div><button onClick={() => createRun()} disabled={!prompt.trim()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-300 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-40">Create plan <Send size={14}/></button></div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">{suggestions.map((item) => <button key={item} onClick={() => createRun(item)} className="rounded-full border border-white/10 px-3 py-2 text-[11px] text-slate-400 transition hover:border-indigo-200/30 hover:text-indigo-100">{item}</button>)}</div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                ["Verified workflows", String(runs.filter((r) => r.status === "Verified").length).padStart(2, "0"), "Evidence-backed outcomes", ShieldCheck],
                ["Awaiting approval", String(runs.filter((r) => r.status === "Needs approval").length).padStart(2, "0"), "You stay in control", Check],
                ["Draft plans", String(runs.filter((r) => r.status === "Draft").length).padStart(2, "0"), "Ready for review", Workflow]
              ].map(([label, value, sub, Icon]) => <div key={label as string} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="flex items-center justify-between text-xs text-slate-500"><span>{label as string}</span><Icon size={15} className="text-slate-500"/></div><div className="mt-3 text-3xl font-semibold tracking-tight">{value as string}</div><div className="mt-1 text-[11px] text-slate-600">{sub as string}</div></div>)}
            </div>

            <div className="mt-12">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><div className="text-xs font-semibold uppercase tracking-[.2em] text-slate-500">Your workspace</div><h2 className="mt-2 text-xl font-semibold">Recent activity</h2></div><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter activity" className="w-44 rounded-xl border border-white/10 bg-white/[.03] py-2 pl-9 pr-3 text-xs outline-none placeholder:text-slate-600 focus:border-indigo-300/40"/></div></div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.02]">
                {visibleRuns.map((run) => <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] px-4 py-4 last:border-0 sm:px-5"><div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-300/10 text-indigo-200"><FileText size={16}/></div><div className="min-w-0"><div className="truncate text-sm font-medium text-slate-200">{run.title}</div><div className="mt-1 text-[11px] text-slate-500">{run.detail}</div></div></div><span className={`rounded-full px-2.5 py-1 text-[10px] ${run.status === "Verified" ? "bg-emerald-300/10 text-emerald-200" : run.status === "Needs approval" ? "bg-amber-300/10 text-amber-200" : "bg-indigo-300/10 text-indigo-200"}`}>{run.status}</span></div>)}
                {visibleRuns.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-500">No matching activity yet.</div>}
              </div>
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.02] p-4"><CircleHelp size={17} className="mt-0.5 shrink-0 text-slate-500"/><div><div className="text-xs font-medium text-slate-300">Prototype workspace</div><p className="mt-1 text-xs leading-5 text-slate-500">{notice}. Plans are currently local demo data; live authentication, persistence, and workflow execution are the next integration steps.</p></div></div>
            <footer className="flex flex-wrap items-center justify-between gap-2 py-8 text-[10px] text-slate-600"><span>ORBIT AI · BUILDING WITH CONTROL</span><span className="inline-flex items-center gap-1">Designed for accountable automation <ArrowUpRight size={11}/></span></footer>
          </div>
        </section>
      </div>
    </main>
  );
}
