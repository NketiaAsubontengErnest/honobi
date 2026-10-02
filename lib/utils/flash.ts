/**
 * Message to show in an error flash. Next.js hides the text of errors thrown by server
 * actions in production builds, so a generic fallback is used when the message is masked.
 */
export function flashError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : "";
  if (!message || /Server Components render|omitted in production|digest/i.test(message)) return fallback;
  return message;
}
