"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plane, LoaderCircle, CheckCircle2, Eye, EyeOff, Mail, LockKeyhole, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "recovery";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("recovery") === "1" || window.location.hash.includes("type=recovery")) {
      setMode("recovery");
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (active && !sessionError && data.session && !window.location.search.includes("recovery=1")) {
        router.replace("/");
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [router]);

  function changeMode(next: Mode) {
    setMode(next);
    setError("");
    setMessage("");
    setDone(false);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setError("Il servizio di accesso non è ancora configurato. Controlla le variabili NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY su Vercel.");
      return;
    }
    if (password.length < 6) {
      setError("La password deve contenere almeno 6 caratteri.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Le due password non coincidono. Controllale e riprova.");
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
          setMessage("Account creato! Controlla la tua casella email (anche la cartella spam) e conferma l'indirizzo prima di accedere.");
        } else {
          router.replace("/");
          router.refresh();
        }
      } else if (mode === "recovery") {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) setError(authError.message);
        else {
          setDone(true);
          setMessage("Password aggiornata correttamente. Ora puoi tornare all'accesso.");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) {
          setError(authError.message === "Invalid login credentials"
            ? "Email o password non corretti. Verifica i dati o usa «Password dimenticata?»."
            : authError.message);
        } else {
          router.replace("/");
          router.refresh();
        }
      }
    } catch {
      setError("Non riesco a contattare il servizio in questo momento. Controlla la connessione e riprova.");
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    setError("");
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setError("Il servizio di accesso non è configurato. Controlla la configurazione Supabase su Vercel.");
      return;
    }
    if (!email.trim()) {
      setError("Scrivi prima la tua email nel campo qui sopra.");
      document.getElementById("login-email")?.focus();
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
        setMessage("Se l'indirizzo è associato a un account, riceverai un'email con il link per scegliere una nuova password.");
      }
    } catch {
      setError("Invio non riuscito. Controlla la connessione e riprova.");
    } finally {
      setBusy(false);
    }
  }

  const recovery = mode === "recovery";
  const signup = mode === "signup";

  return (
    <main className="login-page">
      <div className="login-glow login-glow-one" aria-hidden="true" />
      <div className="login-glow login-glow-two" aria-hidden="true" />
      <Link href="/" className="login-back"><ArrowLeft size={17} /> Torna al calendario</Link>

      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="login-logo"><Plane size={25} /></span>
          <span>Viaggi <strong>Mensili</strong></span>
        </div>
        <div className="login-eyebrow"><Sparkles size={14} /> IL TUO SPAZIO PERSONALE</div>
        <h1 id="login-title">{recovery ? "Una nuova partenza" : signup ? "Inizia il tuo viaggio" : "Bentornato!"}</h1>
        <p className="login-subtitle">
          {recovery ? "Scegli una password nuova e sicura per il tuo account." :
            signup ? "Crea il tuo account e tieni tutti i tuoi viaggi sotto controllo." :
              "Accedi per ritrovare il calendario, le tue notti e il riepilogo mensile."}
        </p>

        {!recovery && <div className="login-tabs" role="tablist" aria-label="Tipo di accesso">
          <button type="button" role="tab" aria-selected={!signup} className={!signup ? "login-tab active" : "login-tab"} onClick={() => changeMode("signin")}>Accedi</button>
          <button type="button" role="tab" aria-selected={signup} className={signup ? "login-tab active" : "login-tab"} onClick={() => changeMode("signup")}>Crea account</button>
        </div>}

        {done ? (
          <div className="login-feedback" role="status">
            <span className="login-success-icon"><CheckCircle2 size={27} /></span>
            <p>{message}</p>
            <button type="button" className="login-primary" onClick={() => { changeMode("signin"); router.replace("/login"); }}>
              {recovery ? "Torna all'accesso" : "Ho capito"}
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="login-form">
              {!recovery && <label htmlFor="login-email">Indirizzo email
                <span className="login-input-wrap"><Mail size={18} /><input id="login-email" type="email" autoComplete="email" placeholder="nome@esempio.it" value={email} onChange={e => setEmail(e.target.value)} required /></span>
              </label>}
              <label htmlFor="login-password">{recovery ? "Nuova password" : "Password"}
                <span className="login-input-wrap"><LockKeyhole size={18} /><input id="login-password" type={showPassword ? "text" : "password"} autoComplete={signup || recovery ? "new-password" : "current-password"} minLength={6} placeholder="Almeno 6 caratteri" value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" className="login-eye" aria-label={showPassword ? "Nascondi password" : "Mostra password"} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
              </label>
              {signup && <label htmlFor="login-confirm">Conferma password
                <span className="login-input-wrap"><LockKeyhole size={18} /><input id="login-confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={6} placeholder="Ripeti la password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></span>
              </label>}
              <button className="login-primary" type="submit" disabled={busy}>
                {busy ? <><LoaderCircle className="login-spinner" size={18} /> Un momento...</> : recovery ? "Aggiorna password" : signup ? "Crea il mio account" : "Accedi al tuo spazio"}
              </button>
            </form>
            {!recovery && !signup && <div className="login-actions"><button type="button" className="login-text-button" onClick={() => void forgotPassword()} disabled={busy}>Password dimenticata?</button></div>}
            {recovery && <button type="button" className="login-text-button recovery-back" onClick={() => { changeMode("signin"); router.replace("/login"); }}>Torna all'accesso</button>}
          </>
        )}
        {message && !done && <p className="login-message" role="status">{message}</p>}
        {error && <p className="login-error" role="alert">{error}</p>}
        <div className="login-trust"><LockKeyhole size={14} /><span>I tuoi dati sono personali e protetti.</span></div>
        <div className="login-card-footer">Un viaggio alla volta, tutto sotto controllo. © 2026 Manna S.r.l.</div>
      </section>
      <p className="login-bottom">I tuoi viaggi, organizzati con semplicità.</p>
    </main>
  );
}
