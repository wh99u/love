const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** Random id from an unambiguous alphabet: a space id is its own password. */
export function randomId(len: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export const SPACE_ID_LEN = 20;
export const isSpaceId = (s: string) => new RegExp(`^[A-Za-z0-9]{${SPACE_ID_LEN}}$`).test(s);

/** Pulls a space id out of a pasted code or invite link. */
export function spaceIdFrom(text: string): string | null {
  const m = /(?:join_)?([A-Za-z0-9]{20})(?![A-Za-z0-9])/.exec(text.trim());
  return m && isSpaceId(m[1]) ? m[1] : null;
}
