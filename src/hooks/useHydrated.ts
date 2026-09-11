"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * False during SSR and the hydration render, true afterwards.
 *
 * The safe way to render something the server cannot know — a localStorage
 * value, the user's clock — without a hydration mismatch. Gate the output on
 * this rather than assigning it from an effect: `useSyncExternalStore` is
 * built for exactly this and avoids the setState-in-effect cascade that the
 * react-hooks rules (rightly) flag.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
