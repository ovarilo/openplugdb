import type { APIRoute } from 'astro';
import { families, findFamily } from '../../../lib/site-data.ts';

// One JSON document per family, identical to its source file minus `$schema`.
export function getStaticPaths() {
  return families().map((f) => ({ params: { id: f.id } }));
}

export const GET: APIRoute = ({ params }) => {
  const { $schema: _schema, ...family } = findFamily(params.id as string)!;
  return new Response(`${JSON.stringify(family, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
