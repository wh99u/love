type Handler = () => void;

/**
 * One system Back button, many things that can be closed: the newest open
 * sheet or page owns it. `apply` receives the current owner (or null) and how many are open.
 */
export function createBackStack(apply: (top: Handler | null, depth: number) => void) {
  const stack: Handler[] = [];
  const sync = () => apply(stack.at(-1) ?? null, stack.length);
  return {
    push(h: Handler) {
      stack.push(h);
      sync();
      return () => {
        const i = stack.lastIndexOf(h);
        if (i >= 0) stack.splice(i, 1);
        sync();
      };
    },
  };
}
