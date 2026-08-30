import { Router } from "express";
import { handleError } from "../http.js";
import { paymentService } from "../payments/PaymentService.js";
import type { PaymentProviderId } from "../payments/types.js";

export const paymentsRouter = Router();

paymentsRouter.post("/initiate", (req, res) => {
  try {
    const { studentId, invoiceNumber, provider } = req.body ?? {};
    if (!studentId || !invoiceNumber) {
      res.status(400).json({ error: "studentId and invoiceNumber are required" });
      return;
    }
    const result = paymentService.initiatePayment({
      studentId,
      invoiceNumber,
      provider: provider as PaymentProviderId | undefined,
    });
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
});
