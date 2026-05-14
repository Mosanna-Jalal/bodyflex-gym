import type { DetailedHTMLProps, HTMLAttributes } from "react";

// Runtime instance — includes animation scrubbing API
export interface ModelViewerInstance extends HTMLElement {
  currentTime: number;
  duration: number;
  loaded: boolean;
  pause(): void;
  play(opts?: { repetitions?: number }): void;
}

type ModelViewerProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  alt?: string;
  autoplay?: boolean;
  "auto-rotate"?: boolean;
  "auto-rotate-delay"?: string;
  "rotation-per-second"?: string;
  "camera-controls"?: boolean;
  "interaction-prompt"?: string;
  "shadow-intensity"?: string;
  exposure?: string;
  orientation?: string;
  "camera-orbit"?: string;
  "min-camera-orbit"?: string;
  "max-camera-orbit"?: string;
  "camera-target"?: string;
  "field-of-view"?: string;
  "environment-image"?: string;
  "tone-mapping"?: string;
  poster?: string;
  loading?: "auto" | "lazy" | "eager";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}
