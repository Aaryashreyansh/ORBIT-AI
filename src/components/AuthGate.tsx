"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Command, LoaderCircle, ShieldCheck } from "lucide-react";

type OrbitAuthContextValue = {
  user: User;
  workspaceId: string;
  supabase: SupabaseClient;
  signOut: () => Promise<void>;
};

const OrbitAuthContext = createContext<OrbitAuthContextValue | null>(null);

export function useOrbitAuth() {
  const value = useContext(OrbitAuthContext);
  if (!value) throw new Error("useOrbitAuth must be used inside AuthGate");
  return value;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [workspaceId, setWorkspaceId] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function prepareWorkspace() {
      if (!supabase || !session?.user) {
        setWorkspaceId("");
        setReady(true);
        return;
      }
      setReady(false);
      setError("");
      const currentUser = session.user;
      const nameFromAccount =
        currentUser.user_metadata?.full_name ||
        currentUser.email?.split("@")[0] ||
        "ORBIT User";

      const profile = await supabase.from("profiles").upsert({
        id: currentUser.id,
        display_name: nameFromAccount
      }, { onConflict: "id" });
      if (profile.error) {
        if (!cancelled) {
          setError("Profile setup failed: " + profile.error.message);
          setReady(true);
        }
        return;
      }

      const existing = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", currentUser.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existing.error) {
        if (!cancelled) {
          setError("Workspace lookup failed: " + existing.error.message);
          setReady(true);
        }
        return;
      }

      let id = existing.data?.id as string | undefined;
      if (!id) {
        const created = await supabase
          .from("workspaces")
          .insert({ name: "My workspace", owner_id: currentUser.id })
          .select("id")
          .single();
        if (created.error || !created.data) {
          if (!cancelled) {
            setError("Workspace creation failed: " + (created.error?.message || "Unknown error"));
            setReady(true);
          }
          return;
        }
        id = created.data.id;
      }

      const membership = await supabase.from("workspace_members").upsert({
        workspace_id: id,
        user_id: currentUser.id,
        role: "owner"
      }, { onConflict: "workspace_id,user_id" });
      if (membership.error) {
        if (!cancelled) {
          setError("Workspace membership setup failed: " + membership.error.message);
          setReady(true);
        }
        return;
      }
      if (!cancelled) {
        setWorkspaceId(id);
        setReady(true);
      }
    }
    prepareWorkspace();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const value = useMemo(() => {
    if (!supabase || !session?.user || !workspaceId) return null;
    return {
      user: session.user,
      workspaceId,
      supabase,
      signOut: async () => { await supabase.auth.signOut(); }
    };
  }, [session?.user?.id, workspaceId]);

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (authMode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: displayName.trim() || email.split("@")[0] } }
        });
        if (authError) throw authError;
        if (!data.session) {
          setMessage("Account created. Check your email to confirm your address, then sign in.");
        } else {
          setMessage("Account created. Preparing your workspace…");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (authError) throw authError;
        setMessage("Signed in. Loading your workspace…");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="max-w-md rounded-3xl border border-white/10 bg-[#101626] p-7 text-center">
          <Command className="mx-auto mb-4 text-indigo-200" size={30}/>
          <h1 className="text-xl font-semibold">ORBIT AI setup required</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Supabase environment variables are missing. Add the project URL and publishable key to the cloud environment, then restart the preview.</p>
        </div>
      </main>
    );
  }

  if (session && (!ready || !workspaceId)) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="text-center">
          <LoaderCircle className="mx-auto mb-4 animate-spin text-indigo-200" size={30}/>
          <p className="text-sm text-slate-300">Preparing your private ORBIT workspace…</p>
          {error && <p className="mt-3 max-w-md text-sm text-rose-300">{error}</p>}
          {error && <button onClick={() => setSession({ ...session })} className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-xs">Retry</button>}
        </div>
      </main>
    );
  }

  if (value) return <OrbitAuthContext.Provider value={value}>{children}</OrbitAuthContext.Provider>;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#101626]/95 p-7 shadow-2xl shadow-indigo-950/30 sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-indigo-300/30 bg-indigo-400/10 text-indigo-200"><Command size={22}/></div>
          <div><div className="font-semibold tracking-[.2em]">ORBIT AI</div><div className="text-[10px] tracking-[.2em] text-slate-500">PRIVATE WORKSPACE</div></div>
        </div>
        <div className="mb-2 flex items-center gap-2 text-xs text-cyan-200"><ShieldCheck size={14}/> Secure account access</div>
        <h1 className="text-2xl font-semibold">{authMode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Sign in to access your saved plans, workflows, and workspace data.</p>
        <form onSubmit={submitAuth} className="mt-7 space-y-4">
          {authMode === "signup" && <label className="block text-xs text-slate-400">Display name<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300/50" placeholder="Your name"/></label>}
          <label className="block text-xs text-slate-400">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300/50" placeholder="you@example.com"/></label>
          <label className="block text-xs text-slate-400">Password<input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={authMode === "signin" ? "current-password" : "new-password"} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300/50" placeholder="At least 6 characters"/></label>
          {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs text-rose-200">{error}</p>}
          {message && <p role="status" className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-xs text-cyan-100">{message}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-indigo-200 disabled:opacity-50">{busy ? <LoaderCircle size={16} className="animate-spin"/> : null}{authMode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-500">{authMode === "signin" ? "New to ORBIT?" : "Already have an account?"} <button onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }} className="font-medium text-indigo-200 hover:text-white">{authMode === "signin" ? "Create account" : "Sign in"}</button></div>
        <p className="mt-7 text-center text-[10px] leading-5 text-slate-600">Your workspace is private. External actions will still require your approval.</p>
      </div>
    </main>
  );
}
