"use client";

import { useCallback, useEffect, useState } from "react";

export type CameraPermissionState =
  | "unknown"
  | "prompt"
  | "granted"
  | "denied";

export interface UseCameraPermissionsResult {
  state: CameraPermissionState;
  /** Browser supports the Permissions API for "camera". */
  supported: boolean;
  /** Force a re-check (useful after explicit retry). */
  refresh: () => Promise<void>;
}

/**
 * Watches `navigator.permissions.query({ name: "camera" })` and auto-updates
 * on settings changes (Chrome / Firefox / Edge). Safari has no Permissions
 * API for camera; we expose `supported=false` and consumers fall back to
 * trying `getUserMedia` directly to discover the permission state.
 */
export function useCameraPermissions(): UseCameraPermissionsResult {
  const [state, setState] = useState<CameraPermissionState>("unknown");
  const [supported, setSupported] = useState(false);
  // Held in STATE (not a ref) so the change-listener effect below re-binds to
  // each PermissionStatus a refresh() yields — binding only the first one left
  // later statuses unwatched.
  const [status, setStatusObj] = useState<PermissionStatus | null>(null);

  const refresh = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      setSupported(false);
      setState("unknown");
      return;
    }
    try {
      // `camera` is in the Permissions spec but TS lib.dom doesn't list it.
      const next = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      setStatusObj(next);
      setSupported(true);
      setState(next.state as CameraPermissionState);
    } catch {
      // Safari throws TypeError for "camera"
      setSupported(false);
      setState("unknown");
    }
  }, []);

  useEffect(() => {
    // Mount-time query of an external system (Permissions API). Every state
    // write lands in refresh()'s async continuation EXCEPT the
    // no-Permissions-API guard, whose synchronous writes equal the initial
    // state (supported=false / "unknown") — a bail-out no-op on mount.
    // Restructuring to useSyncExternalStore would fork the status-in-state
    // listener-rebind fix (see the `status` state comment above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!status) return;
    const handler = () => setState(status.state as CameraPermissionState);
    status.addEventListener("change", handler);
    return () => status.removeEventListener("change", handler);
  }, [status]);

  return { state, supported, refresh };
}
