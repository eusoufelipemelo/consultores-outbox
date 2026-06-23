/* ============================================================
   OutBox Consultores — cliente Supabase (supabase.js)
   Project URL + publishable key (seguras para o front, com RLS).
   ============================================================ */
const SB_URL = 'https://vzxvafjejitlruwhhrax.supabase.co';
const SB_PUBLISHABLE_KEY = 'sb_publishable_KouDnuFK11jXXkY1edtF2Q_mOn8TuSY';

/* emails que viram administrador (deve bater com o trigger handle_new_user no banco) */
const ADMIN_EMAILS = ['felipe@outboxgroup.com.br', 'admin@outboxgroup.com.br', 'contato@outboxgroup.com.br'];

const SB = window.supabase.createClient(SB_URL, SB_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
