import { computePosition, offset, flip, shift, autoUpdate } from "@floating-ui/dom";

export type FloatingOptions = {
  placement?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
};

export function attachFloating(
  reference: HTMLElement,
  floating: HTMLElement,
  opts: FloatingOptions = {}
) {
  const cleanup = autoUpdate(reference, floating, async () => {
    const { x, y } = await computePosition(reference, floating, {
      placement: opts.placement ?? 'top',
      middleware: [offset(opts.offset ?? 8), flip(), shift()]
    });
    Object.assign(floating.style, {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`
    });
  });
  return () => cleanup();
}
