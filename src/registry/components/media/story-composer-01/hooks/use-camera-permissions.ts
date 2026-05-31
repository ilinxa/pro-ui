"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const statusRef = useRef<PermissionStatus | null>(null);

  const refresh = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      setSupported(false);
      setState("unknown");
      return;
    }
    try {
      // `camera` is in the Permissions spec but TS lib.dom doesn't list it.
      const status = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      statusRef.current = status;
      setSupported(true);
      setState(status.state as CameraPermissionState);
    } catch {
      // Safari throws TypeError for "camera"
      setSupported(false);
      setState("unknown");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const status = statusRef.current;
    if (!status) return;
    const handler = () => setState(status.state as CameraPermissionState);
    status.addEventListener("change", handler);
    return () => status.removeEventListener("change", handler);
  }, [supported]);

  return { state, supported, refresh };
}
