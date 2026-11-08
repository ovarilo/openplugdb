import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';
import { checkSvg } from '../src/lib/svg.ts';

const valid = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-labelledby="t">
  <title id="t">Type 2 vehicle inlet, mating face</title>
  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor"/>
</svg>
`;

describe('checkSvg', () => {
  it('accepts a minimal accessible SVG', () => {
    expect(checkSvg(valid)).toEqual([]);
  });

  it('requires an svg root with the SVG namespace and a viewBox', () => {
    expect(checkSvg('<div></div>').join('\n')).toMatch(/root/);
    expect(checkSvg(valid.replace(' viewBox="0 0 100 100"', '')).join('\n')).toMatch(/viewBox/);
    expect(checkSvg(valid.replace(' xmlns="http://www.w3.org/2000/svg"', '')).join('\n')).toMatch(
      /xmlns/,
    );
  });

  it('requires a title and role="img" for accessibility', () => {
    expect(checkSvg(valid.replace(/<title[^]*<\/title>/, '')).join('\n')).toMatch(/title/);
    expect(checkSvg(valid.replace(' role="img"', '')).join('\n')).toMatch(/role/);
  });

  it('rejects scripts, event handlers, embedded images and external references', () => {
    expect(checkSvg(valid.replace('</svg>', '<script>alert(1)</script></svg>')).join('\n')).toMatch(
      /script/,
    );
    expect(checkSvg(valid.replace('<circle', '<circle onclick="x()"')).join('\n')).toMatch(
      /event handler/,
    );
    expect(checkSvg(valid.replace('</svg>', '<image href="a.png"/></svg>')).join('\n')).toMatch(
      /image/,
    );
    expect(
      checkSvg(valid.replace('</svg>', '<use href="https://x.org/a.svg#b"/></svg>')).join('\n'),
    ).toMatch(/external/);
  });

  it('rejects mirrored geometry (opposite gender must be drawn, not flipped)', () => {
    expect(
      checkSvg(
        valid
          .replace('<circle', '<g transform="scale(-1, 1)"><circle')
          .replace('</svg>', '</g></svg>'),
      ).join('\n'),
    ).toMatch(/mirror/);
  });

  it('rejects an opaque full-canvas background', () => {
    const bg = valid.replace('<circle', '<rect width="100%" height="100%" fill="#fff"/><circle');
    expect(checkSvg(bg).join('\n')).toMatch(/background/);
  });

  it('rejects files above the size budget', () => {
    expect(
      checkSvg(valid.replace('</svg>', `<!-- ${'x'.repeat(40_000)} --></svg>`)).join('\n'),
    ).toMatch(/size/);
  });
});

describe('checkSvg in icon mode', () => {
  const upstream = readFileSync(
    join(process.cwd(), 'node_modules/@evicons/svg/svg/plug-type-2.svg'),
    'utf8',
  );
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="9"/>
</svg>
`;
  const issues = (content: string) => checkSvg(content, { mode: 'icon' }).join('\n');

  it('accepts an upstream EVicons file unchanged (fixed size, no title)', () => {
    expect(checkSvg(upstream, { mode: 'icon' })).toEqual([]);
    expect(checkSvg(upstream).join('\n')).toMatch(/width\/height|title|role/);
  });

  it('keeps the root, namespace and viewBox checks', () => {
    expect(issues('<div></div>')).toMatch(/root/);
    expect(issues(icon.replace(' viewBox="0 0 24 24"', ''))).toMatch(/viewBox/);
    expect(issues(icon.replace(' xmlns="http://www.w3.org/2000/svg"', ''))).toMatch(/xmlns/);
  });

  it('keeps the safety, mirror and size rules', () => {
    expect(issues(icon.replace('</svg>', '<script>alert(1)</script></svg>'))).toMatch(/script/);
    expect(issues(icon.replace('<circle', '<circle onload="x()"'))).toMatch(/event handler/);
    expect(issues(icon.replace('</svg>', '<foreignObject/></svg>'))).toMatch(/foreignObject/);
    expect(issues(icon.replace('</svg>', '<image href="a.png"/></svg>'))).toMatch(/image/);
    expect(issues(icon.replace('</svg>', '<use href="https://x.org/a.svg#b"/></svg>'))).toMatch(
      /external/,
    );
    expect(issues(icon.replace('<circle', '<circle transform="matrix(-1 0 0 1 24 0)"'))).toMatch(
      /mirror/,
    );
    expect(issues(icon.replace('</svg>', `<!-- ${'x'.repeat(40_000)} --></svg>`))).toMatch(/size/);
  });
});
