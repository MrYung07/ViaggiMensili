"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BusFront, CheckCircle2, LoaderCircle, Mail, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"link" | "password">("link");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase non è configurato. Aggiungi NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nelle variabili d'ambiente e riavvia il deploy.");
      return;
    }
    setBusy(true);
    if (mode === "password") {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (authError) setError("Accesso non riuscito. Controlla email e password e riprova.");
      else { router.push("/"); router.refresh(); }
    } else {
      const { error: authError } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
      setBusy(false);
      if (authError) setError(authError.message);
      else setSent(true);
    }
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />
      <Link href="/" className="login-back"><ArrowLeft size={17} /> Torna al calendario</Link>
      <section className="login-card">
        <div className="login-brand"><span className="login-logo"><BusFront size={27} /></span><span>Viaggi <strong>Mensili</strong></span></div>
        {!sent ? (
          <>
            <div className="login-icon">{mode === "password" ? <LockKeyhole size={25} /> : <Mail size={25} />}</div>
            <h1>Accedi al tuo account</h1>
            <p className="login-subtitle">Tieni tutti i tuoi viaggi e i tuoi guadagni in un unico posto.</p>
            <form onSubmit={handleSubmit} className="login-form">
              <label htmlFor="login-email">Indirizzo email</label>
              <input id="login-email" type="email" autoComplete="email" placeholder="nome@esempio.it" value={email} onChange={e => setEmail(e.target.value)} required />
              {mode === "password" && <><label htmlFor="login-password">Password</label><input id="login-password" type="password" autoComplete="current-password" placeholder="Inserisci la password" value={password} onChange={e => setPassword(e.target.value)} required /></>}
              <button type="submit" disabled={busy}>{busy ? <><LoaderCircle className="login-spinner" size={18} /> {mode === "password" ? "Accesso in corso..." : "Invio in corso..."}</> : mode === "password" ? <>Accedi <ArrowLeft className="login-arrow" size={18} /></> : <>Invia il link di accesso <ArrowLeft className="login-arrow" size={18} /></>}</button>
            </form>
            <button type="button" className="login-mode-toggle" onClick={() => { setMode(mode === "link" ? "password" : "link"); setError(""); }}>{mode === "link" ? "Usa la password" : "Preferisco il link via email"}</button>
            <p className="login-privacy">{mode === "password" ? "Accedi con email e password del tuo account." : "Ti invieremo un link sicuro via email. Non serve una password."}</p>
            {error && <div className="login-error" role="alert">{error}</div>}
          </>
        ) : (
          <div className="login-success">
            <CheckCircle2 size={44} />
            <h1>Controlla la tua email</h1>
            <p>Abbiamo inviato un link di accesso a <strong>{email}</strong>.</p>
            <p>Apri il messaggio e premi il link per entrare nel tuo calendario.</p>
            <button onClick={() => { setSent(false); setError(""); }}>Usa un'altra email</button>
          </div>
        )}
        <div className="login-card-footer">I tuoi viaggi, organizzati con semplicità.</div>
      </section>
      <p className="login-bottom">© {new Date().getFullYear()} Viaggi Mensili</p>
    </main>
  );
}
