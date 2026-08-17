import type { useRouter } from "expo-router";

type Router = ReturnType<typeof useRouter>;

/**
 * `router.back()`, but safe when the current screen has no navigation
 * history to pop — e.g. opened directly via a deep link, or after a
 * dev-server reload resets the stack to just this screen. Without this,
 * `router.back()` logs a (harmless, dev-only) "GO_BACK was not handled by
 * any navigator" warning and does nothing; this falls back to replacing
 * with `fallbackHref` instead.
 */
export function goBack(router: Router, fallbackHref: Parameters<Router["replace"]>[0]) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackHref);
  }
}
