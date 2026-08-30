export const BILLER_NAME = "Greenfield Academy";
export const PAYMENT_METHOD_LABEL = "1LINK 1BILL";
export const SETTLEMENT_BANK = "Allied Bank Limited (ABL)";

export function mockInquiryEnvelope(bill: {
  consumerNumber: string;
  studentName: string;
  invoiceNumber: string;
  amountPaisa: number;
  dueDate: string;
  feeMonth: string;
}) {
  return {
    responseCode: "00",
    responseMessage: "Bill fetched successfully",
    biller: {
      name: BILLER_NAME,
      category: "EDUCATION",
      settlementBank: SETTLEMENT_BANK,
    },
    bill: {
      consumerNumber: bill.consumerNumber,
      invoiceNumber: bill.invoiceNumber,
      consumerName: bill.studentName,
      billingMonth: bill.feeMonth,
      dueDate: bill.dueDate,
      amountDue: (bill.amountPaisa / 100).toFixed(2),
      currency: "PKR",
      paymentType: "INVOICE_FIXED",
    },
  };
}

export function mockSuccessNotification(input: {
  consumerNumber: string;
  invoiceNumber: string;
  amountPaisa: number;
  transactionId: string;
  paidAt: string;
}) {
  return {
    responseCode: "00",
    responseMessage: "Payment successful",
    transaction: {
      transactionId: input.transactionId,
      consumerNumber: input.consumerNumber,
      invoiceNumber: input.invoiceNumber,
      amountPaid: (input.amountPaisa / 100).toFixed(2),
      currency: "PKR",
      paymentDateTime: input.paidAt,
      status: "PAID",
      channel: "1BILL",
      settlementBank: SETTLEMENT_BANK,
    },
  };
}

export function mockFailedNotification(input: {
  consumerNumber: string;
  invoiceNumber: string;
  amountPaisa: number;
  transactionId: string;
  paidAt: string;
}) {
  return {
    responseCode: "05",
    responseMessage: "Payment declined by 1BILL mock",
    transaction: {
      transactionId: input.transactionId,
      consumerNumber: input.consumerNumber,
      invoiceNumber: input.invoiceNumber,
      amountPaid: (input.amountPaisa / 100).toFixed(2),
      currency: "PKR",
      paymentDateTime: input.paidAt,
      status: "FAILED",
      channel: "1BILL",
      settlementBank: SETTLEMENT_BANK,
    },
  };
}
