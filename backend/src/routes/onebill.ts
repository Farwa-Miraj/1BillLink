import { Router } from "express";
import { handleError, readString } from "../http.js";
import { paymentService } from "../payments/PaymentService.js";

export const oneBillRouter = Router();

oneBillRouter.get("/inquire", (req, res) => {
  try {
    const consumerNumber = readString(req, "consumerNumber");
    if (!consumerNumber) {
      res.status(400).json({ error: "consumerNumber is required" });
      return;
    }
    res.json(paymentService.inquireBill(consumerNumber));
  } catch (error) {
    handleError(res, error);
  }
});

oneBillRouter.post("/pay", (req, res) => {
  try {
    const consumerNumber = readString(req, "consumerNumber");
    if (!consumerNumber) {
      res.status(400).json({ error: "consumerNumber is required" });
      return;
    }
    const fail =
      req.body?.simulateFailure === true ||
      req.query.simulateFailure === "true" ||
      req.body?.outcome === "FAILED";
    const result = paymentService.simulateNetworkPayment(
      consumerNumber,
      fail ? "FAILED" : "SUCCESS",
    );
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});
