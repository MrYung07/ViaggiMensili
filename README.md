# Viaggi Mensili

Dashboard in italiano realizzata con Next.js, TypeScript e Supabase, pronta per Vercel.

## Configurazione
1. Crea un progetto su https://supabase.com/dashboard.
2. Esegui `supabase/schema.sql` nel SQL Editor.
3. Copia `.env.example` in `.env.local` e inserisci URL e chiave publishable/anon di Supabase.
4. Esegui `npm install` e `npm run dev` (Node.js 20+).
5. Importa il repository su https://vercel.com/new e imposta le stesse variabili d'ambiente.
6. Configura in Supabase Authentication gli URL di callback del dominio Vercel.

Non usare mai la service_role key nel browser. Le policy RLS limitano ogni utente ai propri viaggi.
