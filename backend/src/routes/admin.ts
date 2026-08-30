import { Router } from "express";
import { handleError } from "../http.js";
import { paymentService } from "../payments/PaymentService.js";

export const adminRouter = Router();

adminRouter.get("/payments", (_req, res) => {
  try {
    res.json(paymentService.listAdminPayments());
  } catch (error) {
    handleError(res, error);
  }
});

adminRouter.get("/settlement", (_req, res) => {
  try {
    res.json(paymentService.getSettlementView());
  } catch (error) {
    handleError(res, error);
  }
});
