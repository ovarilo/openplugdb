import type { APIRoute } from 'astro';
import { buildExports, type ExportFile } from './exports-files.ts';
import { dataset } from './site-data.ts';

const CONTENT_TYPE: Record<ExportFile, string> = {
  'connectors.json': 'application/json; charset=utf-8',
  'connectors.csv': 'text/csv; charset=utf-8',
};

/**
 * Endpoint serving one export, built by the same function as dist-data/, so
 * the site and the committed exports cannot differ.
 */
export const exportEndpoint =
  (file: ExportFile): APIRoute =>
  () =>
    new Response(buildExports(dataset())[file], {
      headers: { 'Content-Type': CONTENT_TYPE[file] },
    });
