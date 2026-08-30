import { config } from "../../../config.js";
import type { PaymentProvider } from "../../PaymentProvider.js";
import { OneLink1BillMockAdapter } from "./mock/OneLink1BillMockAdapter.js";

/**
 * Public 1LINK 1BILL provider. Today this delegates to the mock adapter.
 * A real sandbox client can replace createAdapter() without changing routes.
 */
export function createOneLink1BillProvider(): PaymentProvider {
  if (config.onelinkMode !== "mock") {
    throw new Error(
      `ONELINK_MODE=${config.onelinkMode} is not implemented. Use mock for this demonstration.`,
    );
  }
  return new OneLink1BillMockAdapter();
}
