/**
 * Interactive delete all products (typed confirmation required)
 *
 * Usage (PowerShell):
 * $env:MONGODB_URI="mongodb+srv://user:pass@.../inventory"; node scripts/delete-all-products.js
 *
 * WARNING: irreversible. Make sure you ran backup script first.
 */

const mongoose = require('mongoose');
const readline = require('readline');

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI not set.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB.');

  const col = mongoose.connection.collection('products');
  const count = await col.countDocuments({});
  console.log(`Products in collection: ${count}`);

  if (count === 0) {
    console.log('No products to delete. Exiting.');
    await mongoose.disconnect();
    return;
  }

  console.log('*** Make sure you have a backup file saved (scripts/products-backup-*.json) before proceeding. ***\n');
  const ans = String(await prompt('Type DELETE to permanently remove ALL products from the "products" collection: ')).trim();

  if (ans !== 'DELETE') {
    console.log('Confirmation not provided. Aborting.');
    await mongoose.disconnect();
    return;
  }

  const res = await col.deleteMany({});
  console.log(`Deleted ${res.deletedCount} documents from "products".`);

  await mongoose.disconnect();
  console.log('Disconnected. Done.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(2);
});
