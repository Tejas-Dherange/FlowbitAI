declare namespace JSX {
  interface IntrinsicElements {
    'vanna-chat': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      'api-base'?: string;
      'sse-endpoint'?: string;
      'ws-endpoint'?: string;
      'poll-endpoint'?: string;
      class?: string;
      ref?: React.RefObject<HTMLElement>;
    }, HTMLElement>;
  }
}