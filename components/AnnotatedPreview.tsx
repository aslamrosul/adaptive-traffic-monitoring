"use client";

import { useState } from "react";

// Preview kanonis: annotated Server 2 dulu, fallback jujur ke snapshot mentah.
// Keduanya via proxy aman (tanpa token ke browser). 4:3 + object-contain.
export default function AnnotatedPreview({
  cameraId,
  tick,
  alt,
  className = "h-full w-full object-contain",
}: {
  cameraId: string;
  tick: number | string;
  alt: string;
  className?: string;
}) {
  const [stage, setStage] = useState<"annotated" | "raw" | "dead">("annotated");
  const key = `${cameraId}-${tick}-${stage}`;
  if (stage === "dead") return null;
  const src =
    stage === "annotated"
      ? `/api/cameras/${encodeURIComponent(cameraId)}/annotated?t=${tick}`
      : `/api/cameras/${encodeURIComponent(cameraId)}/snapshot?t=${tick}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={key}
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        if (stage === "annotated") setStage("raw");
        else setStage("dead");
      }}
    />
  );
}
