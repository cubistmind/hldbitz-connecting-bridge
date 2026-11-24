/*
 * Copyright 2026 CUBISTMIND
 * Licensed under the Apache License, Version 2.0. See LICENSE in the project root.
 */
const ROOT = 'https://hdlbits.01xz.net';
function decode(s) {
  return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}
function plain(s) {
  return decode(s
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(p|div|h[1-6]|li|pre|tr)\b[^>]*>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|pre|tr)>/gi, '\n')
    .replace(/<[^>]*>/g, ''))
    .replace(/[\t ]+\n/g, '\n')
    .replace(/\n[\t ]*\n(?:[\t ]*\n)+/g, '\n\n')
    .trim();
}
function parseCatalogue(html) {
  const start = html.search(/<div[^>]+id=["']mw-content-text["']/i);
  const report = start >= 0 ? html.indexOf('<!-- NewPP limit report', start) : -1;
  const content = start >= 0 ? html.slice(start, report >= 0 ? report : undefined) : html;
  const out = []; let category = 'HDLBits';
  const token = /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>|<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = token.exec(content))) {
    if (m[1] !== undefined) { const h = plain(m[1]).replace(/\[edit\]/gi, '').trim(); if (h && !/^contents$/i.test(h)) category = h; continue; }
    const href = decode(m[2]); const name = plain(m[3]);
    if (!name || !href.startsWith('/wiki/') || href.includes(':') || href.includes('#') || /^Problem sets$/i.test(name)) continue;
    const slug = href.slice('/wiki/'.length);
    if (!/^[\w./()-]+$/.test(slug)) continue;
    out.push({ name, category, url: `${ROOT}${href}`, slug });
  }
  const seen = new Set(); return out.filter(p => !seen.has(p.url) && seen.add(p.url));
}
function parseExercisePage(html) {
  const titleMatch = html.match(/<h1[^>]*id=["']firstHeading["'][^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? plain(titleMatch[1]) : 'HDLBits Problem';
  const bodyStart = html.search(/<div[^>]+id=["']mw-content-text["']/i);
  const fromBody = bodyStart >= 0 ? html.slice(bodyStart) : html;
  const submitOffset = fromBody.search(/<div\b[^>]*id=["']submitbox["']/i);
  const main = submitOffset >= 0 ? fromBody.slice(0, submitOffset) : fromBody;
  const paragraphStart = main.search(/<p\b/i);
  const moduleStart = main.search(/<div\b[^>]*id=["']portlistouterbox["']/i);
  const statementEnd = moduleStart > paragraphStart && paragraphStart >= 0 ? moduleStart : undefined;
  const statementHtml = paragraphStart >= 0 ? main.slice(paragraphStart, statementEnd) : main;
  const statement = plain(statementHtml.replace(/<textarea[\s\S]*?<\/textarea>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, ''));

  const textarea = html.match(/<textarea\b[^>]*id=["']codesubmitbox["'][^>]*>([\s\S]*?)<\/textarea>/i);
  const textareaCode = textarea ? decode(textarea[1].replace(/<[^>]*>/g, '')).trim() : '';
  const moduleHtml = moduleStart >= 0 ? main.slice(moduleStart) : '';
  const declaration = plain(moduleHtml).match(/\bmodule\s+top_module\b[\s\S]*?;/i);
  const starter = /\bmodule\s+top_module\b/i.test(textareaCode)
    ? textareaCode
    : declaration
      ? `${declaration[0]}\n\nendmodule`
      : 'module top_module( );\n\nendmodule';
  return { title, statement, starter };
}
module.exports = { parseCatalogue, parseExercisePage, decode, plain };
