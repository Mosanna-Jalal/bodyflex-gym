import type { DetailedHTMLProps, HTMLAttributes } from "react";

type ModelViewerProps = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  alt?: string;
  autoplay?: boolean;
  "auto-rotate"?: boolean;
  "camera-controls"?: boolean;
  "interaction-prompt"?: string;
  "shadow-intensity"?: string;
  exposure?: string;
  "camera-orbit"?: string;
  "field-of-view"?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}
