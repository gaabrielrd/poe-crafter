import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
// Usa as dependências declaradas pelo consumidor web, inclusive o override restrito.
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { initializeApp, deleteApp } = require('firebase/app');
const {
  connectFirestoreEmulator,
  doc,
  runTransaction,
  getFirestore,
  terminate,
} = require('firebase/firestore');
const firebaseRequire = createRequire(require.resolve('firebase/firestore'));
const firestoreRequire = createRequire(firebaseRequire.resolve('@firebase/firestore'));
const { Server, ServerCredentials } = firestoreRequire('@grpc/grpc-js');

function bytesField(tag, value) {
  const bytes = Buffer.from(value);
  assert.ok(bytes.length < 128, 'Fixture uses a one-byte protobuf length');
  return Buffer.concat([Buffer.from([tag, bytes.length]), bytes]);
}

test(
  'Firestore lê e confirma uma transação pelo transporte gRPC local',
  { timeout: 30000 },
  async () => {
    const server = new Server();
    const name = 'projects/demo-poe-crafter/databases/(default)/documents/transport/missing';
    let received = false;
    let committed = false;
    server.addService(
      {
        commit: {
          path: '/google.firestore.v1.Firestore/Commit',
          requestStream: false,
          responseStream: false,
          requestDeserialize: (bytes) => bytes,
          responseSerialize: (bytes) => bytes,
        },
        batchGetDocuments: {
          path: '/google.firestore.v1.Firestore/BatchGetDocuments',
          requestStream: false,
          responseStream: true,
          requestDeserialize: (bytes) => bytes,
          responseSerialize: (bytes) => bytes,
        },
      },
      {
        commit(_call, callback) {
          committed = true;
          callback(null, Buffer.alloc(0));
        },
        batchGetDocuments(call) {
          received = call.request.includes(Buffer.from(name));
          // BatchGetDocumentsResponse: missing (field 2), read_time (field 4).
          call.write(Buffer.concat([bytesField(18, name), bytesField(34, [8, 1])]));
          call.end();
        },
      },
    );
    const port = await new Promise((resolve, reject) => {
      server.bindAsync('127.0.0.1:0', ServerCredentials.createInsecure(), (error, value) => {
        if (error) reject(error);
        else resolve(value);
      });
    });
    let app;
    let db;
    let timer;
    try {
      server.start();
      app = initializeApp({ projectId: 'demo-poe-crafter' }, 'transport-test');
      db = getFirestore(app);
      connectFirestoreEmulator(db, '127.0.0.1', port);
      const result = await Promise.race([
        runTransaction(db, (transaction) => transaction.get(doc(db, 'transport', 'missing')), {
          maxAttempts: 1,
        }),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('Local Firestore transport timed out')), 10000);
        }),
      ]);
      assert.equal(received, true);
      assert.equal(committed, true);
      assert.equal(result.exists(), false);
    } finally {
      clearTimeout(timer);
      try {
        if (db) await terminate(db);
      } finally {
        try {
          if (app) await deleteApp(app);
        } finally {
          server.forceShutdown();
        }
      }
    }
  },
);
