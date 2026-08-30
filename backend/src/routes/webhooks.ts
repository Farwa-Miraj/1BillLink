import { Router } from "express";
import { handleError } from "../http.js";
import { paymentService } from "../payments/PaymentService.js";

export const webhooksRouter = Router();

webhooksRouter.post("/1bill/payment", (req, res) => {
  try {
    const signature = req.header("X-1BILL-Signature") ?? undefined;
    const result = paymentService.confirmPayment(req.body, signature);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});
