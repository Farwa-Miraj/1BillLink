import type {
  AdminPaymentsResponse,
  BillInquiry,
  ConfirmResult,
  InitiateResult,
  SettlementView,
  Student,
  StudentPortalData,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return body;
}

export const api = {
  listStudents: () => request<{ students: Student[] }>("/api/students"),
  getStudent: (studentId: string) => request<StudentPortalData>(`/api/students/${studentId}`),
  initiate: (studentId: string, invoiceNumber: string) =>
    request<InitiateResult>("/api/payments/initiate", {
      method: "POST",
      body: JSON.stringify({ studentId, invoiceNumber, provider: "ONELINK_1BILL" }),
    }),
  inquire: (consumerNumber: string) =>
    request<BillInquiry>(`/api/1bill/inquire?consumerNumber=${encodeURIComponent(consumerNumber)}`),
  pay: (consumerNumber: string, simulateFailure = false) =>
    request<ConfirmResult>("/api/1bill/pay", {
      method: "POST",
      body: JSON.stringify({ consumerNumber, simulateFailure }),
    }),
  adminPayments: () => request<AdminPaymentsResponse>("/api/admin/payments"),
  settlement: () => request<SettlementView>("/api/admin/settlement"),
};
