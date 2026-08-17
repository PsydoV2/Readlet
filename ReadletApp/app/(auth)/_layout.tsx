import { Redirect, Stack } from "expo-router";

import { useAppLock } from "@/src/context/AppLockProvider";

/**
 * Gate for every screen that requires the app to be unlocked — the
 * "(auth)" group. `app/lock.tsx` (outside this group, so it's reachable
 * even while locked) is the only way past it: as soon as
 * `AppLockProvider.isLocked` is true, this bounces to it instead of
 * rendering any child route below. `isHydrated` is already guaranteed by
 * the time this mounts — `app/_layout.tsx` holds the splash screen up
 * until then, so there's never a flash of unlocked content.
 */
export default function AuthLayout() {
  const { isLocked } = useAppLock();

  if (isLocked) return <Redirect href="/lock" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="import" options={{ presentation: "modal" }} />
      <Stack.Screen name="settings" options={{ presentation: "modal" }} />
    </Stack>
  );
}
