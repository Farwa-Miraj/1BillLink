import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { getDb } from "./db/index.js";
import { adminRouter } from "./routes/admin.js";
import { oneBillRouter } from "./routes/onebill.js";
import { paymentsRouter } from "./routes/payments.js";
import { studentsRouter } from "./routes/students.js";
import { webhooksRouter } from "./routes/webhooks.js";

getDb();

const app = express();
app.use(cors({ origin: ["http://localhost:5170", "http://127.0.0.1:5170"] }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    mode: config.onelinkMode,
    provider: config.paymentProvider,
    mock: true,
  });
});

app.use("/api/students", studentsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/1bill", oneBillRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/admin", adminRouter);

app.listen(config.port, () => {
  console.log(`School fee API listening on http://127.0.0.1:${config.port}`);
  console.log(`1LINK 1BILL mode: ${config.onelinkMode} (demonstration only)`);
});
