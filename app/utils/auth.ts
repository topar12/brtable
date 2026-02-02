export function isNewUser(
  user: { created_at: string; last_sign_in_at?: string | null }
): boolean {
  const createdAt = new Date(user.created_at);
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  return diffMinutes < 5;
}
