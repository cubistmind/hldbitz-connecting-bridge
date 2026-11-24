/*
 * Copyright 2026 CUBISTMIND
 * Licensed under the Apache License, Version 2.0. See LICENSE in the project root.
 */
const vscode = require('vscode');
const https = require('https');
const { parseCatalogue, parseExercisePage } = require('./catalogue');

const ROOT = 'https://hdlbits.01xz.net';
const CATALOGUE = `${ROOT}/wiki/Problem_sets`;
const PROGRESS = `${ROOT}/wiki/Special:VlgStats/Me`;
const LOGIN = `${ROOT}/wiki/Special:VlgLogin`;

function fetchText(url) {
  if (new URL(url).origin !== ROOT) return Promise.reject(new Error('Only official HDLBits pages can be opened.'));
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'HDLBits-Companion-VSCode/0.1 (user initiated)' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = new URL(res.headers.location, url).href;
        if (new URL(next).origin !== ROOT) return reject(new Error('HDLBits redirected away from its official site.'));
        return fetchText(next).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HDLBits returned HTTP ${res.statusCode}`));
      let body = ''; res.setEncoding('utf8'); res.on('data', chunk => body += chunk); res.on('end', () => resolve(body));
    });
    req.setTimeout(15000, () => req.destroy(new Error('HDLBits request timed out')));
    req.on('error', reject);
  });
}

class ProblemTree {
  constructor() { this.emitter = new vscode.EventEmitter(); this.onDidChangeTreeData = this.emitter.event; this.items = []; this.loading = false; }
  refresh() { this.emitter.fire(); }
  getTreeItem(p) { const item = new vscode.TreeItem(p.name, vscode.TreeItemCollapsibleState.None); item.description = p.category; item.contextValue = 'problem'; item.tooltip = `${p.category}\n${p.url}`; item.command = { command: 'hdlbits.openProblem', title: 'View Problem', arguments: [p] }; return item; }
  getChildren() {
    if (this.items.length || this.loading) return this.items;
    this.load();
    return [];
  }
  async load() {
    if (this.loading) return this.loadPromise;
    this.loading = true;
    this.loadPromise = fetchText(vscode.workspace.getConfiguration('hdlbits').get('catalogueUrl', CATALOGUE)).then(html => { this.items = parseCatalogue(html); if (!this.items.length) vscode.window.showWarningMessage('HDLBits catalogue loaded, but no exercises were found.'); }, err => { this.items = []; vscode.window.showErrorMessage(`Could not load HDLBits catalogue: ${err.message}`); }).finally(() => { this.loading = false; this.refresh(); });
    return this.loadPromise;
  }
}

async function getProblemPage(problem) {
  const html = await fetchText(problem.url);
  return { html, ...parseExercisePage(html) };
}

function showStatement(problem, page) {
  const panel = vscode.window.createWebviewPanel('hdlbits.statement', `${page.title} — HDLBits`, vscode.ViewColumn.Beside, { enableScripts: false });
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  panel.webview.html = `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><style>body{font:14px var(--vscode-font-family);color:var(--vscode-foreground);max-width:900px;margin:2rem auto;padding:0 1rem;line-height:1.55}pre{white-space:pre-wrap;background:var(--vscode-textCodeBlock-background);padding:1rem;border-radius:4px}a{color:var(--vscode-textLink-foreground)}</style><h1>${esc(page.title)}</h1><p><a href="${problem.url}">Open official HDLBits page ↗</a></p><pre>${esc(page.statement)}</pre><h2>Module declaration</h2><pre>${esc(page.starter)}</pre><p>Use <b>HDLBits: Open Starter in Editor</b> from the problem list to create an editable Verilog file.</p>`;
}

async function withPage(problem, fn) {
  if (!problem || !problem.url || !problem.url.startsWith(ROOT + '/wiki/')) return vscode.window.showInformationMessage('Select an HDLBits exercise in the HDLBits view first.');
  try { await fn(await getProblemPage(problem)); } catch (e) { vscode.window.showErrorMessage(`Could not read this HDLBits exercise: ${e.message}`); }
}

function activate(context) {
  const tree = new ProblemTree();
  context.subscriptions.push(vscode.window.registerTreeDataProvider('hdlbitsProblems', tree));
  context.subscriptions.push(vscode.commands.registerCommand('hdlbits.refreshProblems', () => { tree.items = []; tree.refresh(); }));
  context.subscriptions.push(vscode.commands.registerCommand('hdlbits.openProblem', p => withPage(p, page => showStatement(p, page))));
  context.subscriptions.push(vscode.commands.registerCommand('hdlbits.startSolution', p => withPage(p, async page => {
    const doc = await vscode.workspace.openTextDocument({ language: 'verilog', content: page.starter + '\n' }); await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
    vscode.window.setStatusBarMessage(`HDLBits exercise: ${page.title}`, 5000);
  })));
  context.subscriptions.push(vscode.commands.registerCommand('hdlbits.submitSolution', async p => {
    const editor = vscode.window.activeTextEditor; if (!editor) return vscode.window.showWarningMessage('Open a Verilog solution file first.');
    let problem = p;
    if (!problem && !tree.items.length) await tree.load();
    if (!problem) problem = await vscode.window.showQuickPick(tree.items.map(x => ({ label: x.name, description: x.category, problem: x })), { placeHolder: 'Choose the HDLBits exercise for this solution' }).then(x => x && x.problem);
    if (!problem) return;
    await vscode.env.clipboard.writeText(editor.document.getText());
    const opened = await vscode.env.openExternal(vscode.Uri.parse(problem.url));
    if (opened) vscode.window.showInformationMessage('Solution copied. On the official HDLBits page, paste it into the solution box and press Submit. The HDLBits judge records your result in your account.');
    else vscode.window.showErrorMessage('Could not open the official HDLBits page. Your solution remains on the clipboard.');
  }));
  context.subscriptions.push(vscode.commands.registerCommand('hdlbits.openProgress', () => vscode.env.openExternal(vscode.Uri.parse(PROGRESS))));
  context.subscriptions.push(vscode.commands.registerCommand('hdlbits.openLogin', () => vscode.env.openExternal(vscode.Uri.parse(LOGIN))));
}
function deactivate() {}
module.exports = { activate, deactivate };
