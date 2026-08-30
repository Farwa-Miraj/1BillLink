import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "..");
dotenv.config({ path: path.join(backendRoot, ".env") });

const rawDb = process.env.DATABASE_PATH ?? "./data/school-fees.db";

export const config = {
  port: Number(process.env.PORT ?? 4010),
  databasePath: path.isAbsolute(rawDb) ? rawDb : path.resolve(backendRoot, rawDb),
  paymentProvider: (process.env.PAYMENT_PROVIDER ?? "onelink1bill").toLowerCase(),
  onelinkMode: (process.env.ONELINK_MODE ?? "mock").toLowerCase(),
  onelinkMockSecret: process.env.ONELINK_MOCK_SECRET ?? "demo-only",
  onelinkBillerPrefix: process.env.ONELINK_BILLER_PREFIX ?? "108801",
};
