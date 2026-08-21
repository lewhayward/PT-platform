"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lookupBarcode, type ScannedFood } from "@/app/client/nutrition/actions";

type Panel = "closed" | "camera" | "manual";

// Uses the browser's native BarcodeDetector API where it exists (no extra
// library/bundle size), and falls back to typing the barcode's digits in
// by hand wherever it doesn't - notably Safari on some versions/platforms
// doesn't support it, so this can't assume the camera path is available.
export function BarcodeScanButton({
  onScanned,
}: {
  onScanned: (food: ScannedFood) => void;
}) {
  const [panel, setPanel] = useState<Panel>("closed");
  const [lookingUp, setLookingUp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stoppedRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  function stopCamera() {
    stoppedRef.current = true;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  useEffect(() => stopCamera, []);

  async function handleBarcode(barcode: string) {
    setLookingUp(true);
    setMessage(null);
    try {
      const result = await lookupBarcode(barcode);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setPanel("closed");
      setManualBarcode("");
      onScanned(result.food);
    } catch {
      // lookupBarcode is a server action - a network hiccup or an expired
      // session surfaces here as a rejected promise, not a BarcodeLookupResult.
      // Without this catch, "Looking up..." would spin forever with no way
      // to try again.
      setMessage("Something went wrong looking that up. Please try again.");
    } finally {
      setLookingUp(false);
    }
  }

  async function startScan() {
    setMessage(null);

    if (!("BarcodeDetector" in window)) {
      setPanel("manual");
      return;
    }

    setPanel("camera");
    stoppedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (!videoRef.current) {
        throw new Error("Video element not ready");
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    } catch {
      // Covers both getUserMedia being denied/unavailable AND play()
      // rejecting (common on mobile Safari) after the stream was already
      // granted - stopCamera() here matters because without it, a stream
      // acquired in the try block but never successfully attached would
      // otherwise keep the camera's indicator light on indefinitely.
      stopCamera();
      setPanel("manual");
      setMessage(
        "Couldn't access the camera - you can type the barcode number instead."
      );
      return;
    }

    type BarcodeDetectorLike = {
      detect: (
        source: HTMLVideoElement
      ) => Promise<{ rawValue: string }[]>;
    };
    const BarcodeDetectorCtor = (
      window as unknown as {
        BarcodeDetector: new (opts: {
          formats: string[];
        }) => BarcodeDetectorLike;
      }
    ).BarcodeDetector;
    const detector = new BarcodeDetectorCtor({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
    });

    const tick = async () => {
      if (stoppedRef.current || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        // Re-checked after the await, not just at the top of tick() - the
        // user could have hit Cancel (or the component could have
        // unmounted) while detection was in flight, and a code found on
        // that stale pass shouldn't still fire a lookup/onScanned.
        if (stoppedRef.current) return;
        if (codes.length > 0) {
          stopCamera();
          setPanel("closed");
          await handleBarcode(codes[0].rawValue);
          return;
        }
      } catch {
        // One failed detection pass just means "nothing found in this
        // frame" - not fatal, keep trying until cancelled or a code is
        // found.
      }
      if (!stoppedRef.current) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
  }

  function cancel() {
    stopCamera();
    setPanel("closed");
    setMessage(null);
  }

  return (
    <div>
      {panel === "closed" && (
        <Button type="button" variant="secondary" onClick={startScan}>
          Scan barcode
        </Button>
      )}

      {panel === "camera" && (
        <div className="flex flex-col gap-2">
          <video
            ref={videoRef}
            className="w-full rounded-lg bg-black"
            muted
            playsInline
          />
          <Button type="button" variant="ghost" onClick={cancel}>
            Cancel
          </Button>
        </div>
      )}

      {panel === "manual" && (
        <div className="flex flex-col gap-2">
          <Input
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="Type the barcode number"
            inputMode="numeric"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={lookingUp || manualBarcode.trim().length === 0}
              onClick={() => handleBarcode(manualBarcode)}
            >
              {lookingUp ? "Looking up…" : "Look up"}
            </Button>
            <Button type="button" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {lookingUp && panel === "closed" && (
        <p className="mt-1 text-xs text-muted">Looking up product…</p>
      )}
      {message && <p className="mt-1 text-xs text-danger">{message}</p>}
    </div>
  );
}
