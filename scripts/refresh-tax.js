/**
 * scripts/refresh-tax.js
 *
 * Usage examples (PowerShell):
 * $env:MONGODB_URI="mongodb+srv://<user>:<pass>@cluster0.../inventory"; node scripts/refresh-tax.js --fill-missing 0
 * $env:MONGODB_URI="mongodb+srv://<user>:<pass>@cluster0.../inventory"; node scripts/refresh-tax.js --set 5
 * $env:MONGODB_URI="..."; node scripts/refresh-tax.js --from-file ./tax-map.json
 *
 * tax-map.json format (array or object):
 * [
 *   { "id": "614...", "tax": 12.5 },
 *   { "id": "615...", "tax": 5 }
 * ]
 *
 * or
 *
 * { "614...": 12.5, "615...": 5 }
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const argv = process.argv.slice(2);

// simple arg parsing
function parseArgs(args) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--set" && args[i + 1] != null) {
      out.mode = "set";
      out.value = Number(args[++i]);
    } else if (a === "--fill-missing" && args[i + 1] != null) {
      out.mode = "fill-missing";
      out.value = Number(args[++i]);
    } else if (a === "--from-file" && args[i + 1] != null) {
      out.mode = "from-file";
      out.file = args[++i];
    } else if (a.startsWith("--set=")) {
      out.mode = "set";
      out.value = Number(a.split("=")[1]);
    } else if (a.startsWith("--fill-missing=")) {
      out.mode = "fill-missing";
      out.value = Number(a.split("=")[1]);
    } else if (a.startsWith("--from-file=")) {
      out.mode = "from-file";
      out.file = a.split("=")[1];
    } else {
      // ignore unknown flags
    }
  }
  return out;
}

const opts = parseArgs(argv);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI environment variable is not set.");
  console.error('In PowerShell example: $env:MONGODB_URI="mongodb+srv://user:pass@cluster0.../inventory"; node scripts/refresh-tax.js --fill-missing 0');
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log("Connected to MongoDB.");

  // Using direct collection operations so this script is independent of your project model path.
  const Product = mongoose.connection.collection("products");

  try {
    if (!opts.mode) {
      // default: fill missing with 0
      const value = 0;
      const filter = { $or: [{ taxPercent: { $exists: false } }, { taxPercent: null }] };
      const res = await Product.updateMany(filter, { $set: { taxPercent: value } });
      console.log(`Filled missing taxPercent with ${value}. Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);
      return;
    }

    if (opts.mode === "set") {
      const value = Number(opts.value);
      if (Number.isNaN(value) || value < 0 || value > 100) {
        throw new Error("Invalid tax value. Must be a number between 0 and 100.");
      }
      const res = await Product.updateMany({}, { $set: { taxPercent: value } });
      console.log(`Set taxPercent = ${value} for all products. Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);
      return;
    }

    if (opts.mode === "fill-missing") {
      const value = Number(opts.value);
      if (Number.isNaN(value) || value < 0 || value > 100) {
        throw new Error("Invalid tax value. Must be a number between 0 and 100.");
      }
      const filter = { $or: [{ taxPercent: { $exists: false } }, { taxPercent: null }] };
      const res = await Product.updateMany(filter, { $set: { taxPercent: value } });
      console.log(`Filled missing taxPercent with ${value}. Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);
      return;
    }

    if (opts.mode === "from-file") {
      const filePath = path.resolve(process.cwd(), opts.file);
      if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
      const raw = fs.readFileSync(filePath, "utf8");
      let data = JSON.parse(raw);

      // Normalize to array of { id, tax }
      let updates = [];
      if (Array.isArray(data)) {
        updates = data.map((it) => {
          if (it.id == null || it.tax == null) throw new Error("Each array item must have 'id' and 'tax' fields.");
          return { id: String(it.id), tax: Number(it.tax) };
        });
      } else if (typeof data === "object") {
        updates = Object.keys(data).map((k) => ({ id: k, tax: Number(data[k]) }));
      } else {
        throw new Error("Unexpected file format. Provide an array or object mapping.");
      }

      // Validate
      for (const u of updates) {
        if (Number.isNaN(u.tax) || u.tax < 0 || u.tax > 100) {
          throw new Error(`Invalid tax for id ${u.id}: ${u.tax}`);
        }
      }

      let modifiedTotal = 0;
      for (const u of updates) {
        const res = await Product.updateOne({ _id: new mongoose.Types.ObjectId(u.id) }, { $set: { taxPercent: u.tax } });
        if (res.matchedCount > 0 && res.modifiedCount > 0) modifiedTotal++;
      }
      console.log(`Applied per-id updates from file. Updated ${modifiedTotal}/${updates.length} documents (modified).`);
      return;
    }

    throw new Error("Unknown mode.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(2);
});
