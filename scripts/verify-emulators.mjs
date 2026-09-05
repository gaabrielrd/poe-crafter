#!/usr/bin/env node

import assert from 'node:assert/strict';

const projectId = process.env.GCLOUD_PROJECT ?? 'demo-poe-crafter';
const hostingOrigin = `http://${process.env.FIREBASE_HOSTING_EMULATOR_HOST ?? '127.0.0.1:5000'}`;
const firestoreOrigin = `http://${process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080'}`;
const storageOrigin = `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? '127.0.0.1:9199'}`;

const hosting = await fetch(hostingOrigin);
const html = await hosting.text();
assert.equal(hosting.status, 200, `Hosting respondeu ${hosting.status}.`);
assert.match(html, /PoE Crafting Planner/, 'Hosting não serviu o bundle esperado.');

const firestore = await fetch(
  `${firestoreOrigin}/v1/projects/${projectId}/databases/(default)/documents/private/probe`,
);
assert.equal(firestore.status, 403, `Firestore deny-all respondeu ${firestore.status}.`);

const bucket = `${projectId}.appspot.com`;
const storage = await fetch(`${storageOrigin}/v0/b/${bucket}/o/private%2Fprobe?alt=media`);
assert.equal(storage.status, 403, `Storage deny-all respondeu ${storage.status}.`);

console.log('Emuladores OK: Hosting 200; Firestore 403; Storage 403.');
