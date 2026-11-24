/*
 * Copyright 2026 CUBISTMIND
 * Licensed under the Apache License, Version 2.0. See LICENSE in the project root.
 */
const assert = require('node:assert/strict');
const { parseCatalogue, parseExercisePage } = require('../catalogue');

const html = `<html><div id="mw-content-text"><h2>Getting Started</h2><ul><li><a href="/wiki/step_one">Getting Started</a></li></ul><h2>Verilog Language</h2><h3>Basics</h3><ul><li><a href="/wiki/wire">Simple wire</a></li><li><a href="/wiki/wire4">Four wires</a></li></ul><a href="/wiki/Special:VlgLogin">Log in</a><a href="https://example.com/wiki/bad">bad</a></div><!-- NewPP limit report --></html>`;
const problems = parseCatalogue(html);
assert.equal(problems.length, 3);
assert.equal(problems[0].slug, 'step_one');
assert.equal(problems[1].category, 'Basics');
assert.equal(problems[1].url, 'https://hdlbits.01xz.net/wiki/wire');
assert.equal(problems[2].name, 'Four wires');
console.log('catalogue parser checks passed');

const exerciseHtml = `<html><h1 id="firstHeading">Wire</h1><div id="mw-content-text"><div class="prev-next"><a href="/wiki/zero">zero</a> Previous</div><div class="next">Next <a href="/wiki/wire4">wire4</a></div><p><!-- #firstHeading::after{content:"icon"} -->Create a module with one input and one output that behaves like a wire.</p><p>Connect <code>in</code> to <code>out</code>.</p><div id="portlistouterbox"><div id="portlistbox">Module Declaration<pre>module top_module( input in, output out );</pre></div></div><div id="submitbox"><textarea id="codesubmitbox"></textarea></div></div></html>`;
const exercise = parseExercisePage(exerciseHtml);
assert.equal(exercise.title, 'Wire');
assert.match(exercise.statement, /^Create a module/);
assert.doesNotMatch(exercise.statement, /zero|wire4|#firstHeading|Module Declaration/);
assert.equal(exercise.starter, 'module top_module( input in, output out );\n\nendmodule');
const filledExercise = parseExercisePage(exerciseHtml.replace('<textarea id="codesubmitbox"></textarea>', '<textarea id="codesubmitbox">module top_module( input in, output out );\nassign out = in;\nendmodule</textarea>'));
assert.match(filledExercise.starter, /assign out = in;/);
console.log('exercise statement and starter checks passed');
