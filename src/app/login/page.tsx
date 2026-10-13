"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plane, LoaderCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "recovery";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get("recovery") === "1" ? "recovery" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function changeMode(next: Mode) {
    setMode(next);
    setError("");
    setMessage("");
    setDone(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase non è configurato. Controlla NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY su Vercel.");
      return;
    }
    if (mode !== "recovery" && password.length < 6) {
      setError("La password deve contenere almeno 6 caratteri.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (authError) setError(authError.message);
        else if (!data.session) {
          setDone(true);
          setMessage("Account creato. Controlla la posta, anche lo spam, e conferma il tuo indirizzo email prima di accedere.");
        } else {
          router.replace("/");
          router.refresh();
        }
      } else if (mode === "recovery") {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) setError(authError.message);
        else {
          setDone(true);
          setMessage("Password aggiornata. Ora puoi accedere con la nuova password.");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) setError(authError.message === "Invalid login credentials" ? "Email o password non corretti. Se non hai ancora creato un account, premi «Crea account»." : authError.message);
        else {
          router.replace("/");
          router.refresh();
        }
      }
    } catch {
      setError("Errore di connessione. Riprova tra poco.");
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    setError("");
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setError("Servizio di accesso non disponibile. Controlla la configurazione Supabase.");
      return;
    }
    if (!email.trim()) {
      setError("Inserisci prima la tua email.");
      return;
    }
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + "/login?recovery=1",
      });
      if (authError) setError(authError.message);
      else {
        setDone(true);
        setMessage("Se l'indirizzo è registrato, riceverai le istruzioni per reimpostare la password.");
      }
    } catch {
      setError("Errore di connessione. Riprova tra poco.");
    } finally {
      setBusy(false);
    }
  }

  const recovery = mode === "recovery";
  const signup = mode === "signup";

  return (
    <main className="login-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />
      <Link href="/" className="login-back"><ArrowLeft size={17} /> Torna al calendario</Link>
      <section className="login-card">
        <div className="login-brand"><span className="login-logo"><Plane size={26} /></span><span>Viaggi <strong>Mensili</strong></span></div>
        <h1>{recovery ? "Crea una nuova password" : "Viaggi Mensili"}</h1>
        <p className="login-subtitle">{recovery ? "Scegli una nuova password per il tuo account." : "Accedi per registrare le notti, calcolare gli importi settimanali e controllare il totale mensile."}</p>

        {!recovery && <div className="login-tabs">
          <button type="button" className={mode === "signin" ? "login-tab active" : "login-tab"} onClick={() => changeMode("signin")}>Accedi</button>
          <button type="button" className={mode === "signup" ? "login-tab active" : "login-tab"} onClick={() => changeMode("signup")}>Crea account</button>
        </div>}

        {done ? (
          <div className="login-feedback"><CheckCircle2 size={25} /><p>{message}</p>{mode === "recovery" && <button type="button" className="login-primary" onClick={() => { changeMode("signin"); router.replace("/login"); }}>Vai all'accesso</button>}</div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="login-form">
              {!recovery && <label htmlFor="login-email">Email<input id="login-email" type="email" autoComplete="email" placeholder="tu@email.it" value={email} onChange={e => setEmail(e.target.value)} required /></label>}
              <label htmlFor="login-password">{recovery ? "Nuova password" : "Password"}<input id="login-password" type="password" autoComplete={signup || recovery ? "new-password" : "current-password"} minLength={6} placeholder="Almeno 6 caratteri" value={password} onChange={e => setPassword(e.target.value)} required /></label>
              <button className="login-primary" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="login-spinner" size={18} /> Attendi...</> : recovery ? "Aggiorna password" : signup ? "Crea account" : "Accedi"}</button>
            </form>
            {!recovery && !signup && <div className="login-actions"><button type="button" className="login-text-button" onClick={() => void forgotPassword()} disabled={busy}>Ho dimenticato la password</button></div>}
            {recovery && <button type="button" className="login-text-button recovery-back" onClick={() => { changeMode("signin"); router.replace("/login"); }}>Torna all'accesso</button>}
          </>
        )}
        {message && !done && <p className="login-message" role="status">{message}</p>}
        {error && <p className="login-error" role="alert">{error}</p>}
        <div className="login-card-footer">Crea un account con un'email valida per accedere da telefono e tablet. Potrebbe essere necessario confermare l'indirizzo email. © 2026 Manna S.r.l.</div>
      </section>
      <p className="login-bottom">I tuoi viaggi, organizzati con semplicità.</p>
    </main>
  );
}
