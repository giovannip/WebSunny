import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "dotlottie-player": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          loop?: string;
          autoplay?: boolean;
          speed?: number;
          background?: string;
        },
        HTMLElement
      >;
    }
  }
}
