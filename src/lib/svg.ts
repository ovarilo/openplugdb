/** Maximum size of a connector SVG, in bytes. Keeps illustrations lightweight. */
export const SVG_MAX_BYTES = 30_000;

export interface SvgCheckOptions {
  /**
   * 'drawing' (default): technical drawings under connectors/, full rules.
   * 'icon': UI icons under icons/. Upstream icon sets ship a fixed width/height
   * and no <title> (the page gives the alternative text), so the sizing and
   * accessibility rules are relaxed; safety, mirror and size rules still apply.
   */
  mode?: 'drawing' | 'icon';
}

/**
 * Structural checks for connector illustrations (see docs/svg.md).
 * Regex-based on purpose: files are small, hand-written and must stay simple.
 */
export function checkSvg(content: string, { mode = 'drawing' }: SvgCheckOptions = {}): string[] {
  const issues: string[] = [];
  const root = /^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[^]*?-->\s*)*<svg\b([^>]*)>/.exec(content);
  if (!root) return ['missing <svg> root element'];
  const attrs = root[1] ?? '';

  if (!/\sxmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(attrs))
    issues.push('missing xmlns on <svg>');
  if (!/\sviewBox="[^"]+"/.test(attrs)) issues.push('missing viewBox on <svg>');
  if (mode === 'drawing') {
    if (/\s(width|height)="/.test(attrs))
      issues.push('fixed width/height on <svg>: size must come from the viewBox');
    if (!/\srole="img"/.test(attrs)) issues.push('missing role="img" on <svg>');
    if (!/<title\b[^>]*>[^<]+<\/title>/.test(content)) issues.push('missing non-empty <title>');
  }

  if (/<script\b/i.test(content)) issues.push('<script> is not allowed');
  if (/<foreignObject\b/i.test(content)) issues.push('<foreignObject> is not allowed');
  if (/\son[a-z]+\s*=/i.test(content)) issues.push('event handler attributes are not allowed');
  if (/<image\b/i.test(content)) issues.push('embedded <image> is not allowed: draw vectors');
  if (/(?:xlink:)?href\s*=\s*"(?!#)/i.test(content) || /url\(\s*['"]?(?!#)/i.test(content)) {
    issues.push('external references are not allowed (only local #fragment references)');
  }
  if (/scale\(\s*-1/.test(content) || /matrix\(\s*-1/.test(content)) {
    issues.push('mirror transform found: draw the opposite gender, do not mirror it');
  }
  if (
    /<rect\b(?=[^>]*\swidth="100%")(?=[^>]*\sheight="100%")(?![^>]*\sfill="none")[^>]*>/.test(
      content,
    )
  ) {
    issues.push('opaque full-canvas background found: background must be transparent');
  }
  if (new TextEncoder().encode(content).length > SVG_MAX_BYTES) {
    issues.push(`file size exceeds ${SVG_MAX_BYTES} bytes`);
  }
  return issues;
}
