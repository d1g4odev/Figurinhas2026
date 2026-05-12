import { createClient, type Session } from '@supabase/supabase-js';
import type { AlbumState } from '../features/album/album.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'figurinhas-copa-2026-supabase-auth'
      }
    })
  : null;

const TABLE_NAME = 'album_backups';

type CloudAlbumRow = {
  user_id: string;
  payload: AlbumState;
  updated_at: string;
};

export async function ensureSupabaseSession() {
  if (!supabase) {
    return { session: null as Session | null, error: new Error('Supabase não configurado.') };
  }

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (session) return { session, error: null };
  if (sessionError) return { session: null as Session | null, error: sessionError };

  const { data, error } = await supabase.auth.signInAnonymously();
  return { session: data.session ?? null, error };
}

export async function saveAlbumBackup(album: AlbumState) {
  const { session, error } = await ensureSupabaseSession();
  if (!session || error) {
    throw error ?? new Error('Não consegui abrir uma sessão no Supabase.');
  }

  const payload: CloudAlbumRow = {
    user_id: session.user.id,
    payload: album,
    updated_at: new Date().toISOString()
  };

  const { error: upsertError } = await supabase!
    .from(TABLE_NAME)
    .upsert(payload, { onConflict: 'user_id' });

  if (upsertError) throw upsertError;

  return {
    userId: session.user.id,
    updatedAt: payload.updated_at
  };
}

export async function loadAlbumBackup() {
  const { session, error } = await ensureSupabaseSession();
  if (!session || error) {
    throw error ?? new Error('Não consegui abrir uma sessão no Supabase.');
  }

  const { data, error: selectError } = await supabase!
    .from(TABLE_NAME)
    .select('payload, updated_at')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (selectError) throw selectError;

  return {
    userId: session.user.id,
    payload: data?.payload ?? null,
    updatedAt: data?.updated_at ?? null
  };
}

export function formatSupabaseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (message.includes('Anonymous sign-ins are disabled')) {
    return 'Ative Anonymous Sign-Ins no painel do Supabase para liberar a sincronização.';
  }

  if (message.includes('relation') && message.includes('album_backups')) {
    return 'A tabela album_backups ainda não existe no Supabase. Rode o SQL que eu deixei na pasta supabase/.';
  }

  if (message.includes('row-level security')) {
    return 'As policies do Supabase ainda não deixam esse usuário salvar ou ler o álbum.';
  }

  return message || 'O Supabase respondeu com erro, mas sem detalhe legível.';
}
