export function getServerSupabaseServiceRoleKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (key) {
    return key;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY es obligatoria en producción; no usar NEXT_PUBLIC_.',
    );
  }

  return null;
}
