import { Router } from "express";
import { paymentService } from "../payments/PaymentService.js";
import { handleError } from "../http.js";

export const studentsRouter = Router();

studentsRouter.get("/", (_req, res) => {
  res.json({ students: paymentService.listStudents() });
});

studentsRouter.get("/:studentId", (req, res) => {
  try {
    const payload = paymentService.getStudentPortal(req.params.studentId);
    if (!payload) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    res.json(payload);
  } catch (error) {
    handleError(res, error);
  }
});
