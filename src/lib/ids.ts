let seq = 0;

/** Short unique id: time + counter + randomness, safe for two devices later. */
export const uid = () =>
  Date.now().toString(36) + (seq++ % 1296).toString(36).padStart(2, '0') + Math.random().toString(36).slice(2, 6);
