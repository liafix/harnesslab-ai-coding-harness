import type { RepositoryFile, RepositorySnapshot } from "../../domain/types";

const coreFiles: RepositoryFile[] = [
  { path: "services/invoices/invoice-service.ts", module: "invoice-service", language: "TypeScript", dependencies: ["domain/billing/invoice-policy.ts", "repositories/invoice.repository.ts", "integrations/erp/erp-adapter.ts"], relevanceTags: ["invoice", "export", "erp", "retry"], contentExcerpt: "export async function exportInvoice(invoice) { /* orchestration */ }" },
  { path: "domain/billing/invoice-policy.ts", module: "billing-domain", language: "TypeScript", dependencies: [], relevanceTags: ["invoice", "duplicate", "policy"], contentExcerpt: "export function canExportInvoice(invoice) { /* domain rules */ }" },
  { path: "repositories/invoice.repository.ts", module: "invoice-repository", language: "TypeScript", dependencies: [], relevanceTags: ["invoice", "fingerprint", "persistence"], contentExcerpt: "export async function findExportByFingerprint(fp) { /* query */ }" },
  { path: "integrations/erp/erp-adapter.ts", module: "erp-adapter", language: "TypeScript", dependencies: [], relevanceTags: ["erp", "invoice", "export"], contentExcerpt: "export async function sendInvoice(payload) { /* ERP call */ }" },
  { path: "tests/integration/invoice-retry.integration.test.ts", module: "integration-tests", language: "TypeScript", dependencies: ["services/invoices/invoice-service.ts"], relevanceTags: ["invoice", "retry", "audit", "integration"], contentExcerpt: "it('keeps retries idempotent', async () => { /* ... */ })" },
  { path: "business-invariants/invoice-export.ts", module: "business-invariants", language: "TypeScript", dependencies: [], relevanceTags: ["protected", "invariant"], protected: true, contentExcerpt: "export const invoiceExportInvariants = [/* protected rules */]" },
  { path: "release-policy/policy.ts", module: "release-policy", language: "TypeScript", dependencies: [], relevanceTags: ["protected", "release"], protected: true, contentExcerpt: "export const releasePolicy = { blockingFailures: true }" },
  { path: "architecture-contract/public-api.ts", module: "architecture-contract", language: "TypeScript", dependencies: [], relevanceTags: ["protected", "api"], protected: true, contentExcerpt: "export const publicApiContract = {/* protected */}" },
];

const alternateTaskFiles: RepositoryFile[] = [
  { path: "modules/orders/order-service.ts", module: "orders", language: "TypeScript", dependencies: ["modules/warehouse/reservation-service.ts"], relevanceTags: ["order", "reservation"], contentExcerpt: "export async function reserveOrderStock(order) { /* reservation */ }" },
  { path: "modules/warehouse/reservation-service.ts", module: "warehouse", language: "TypeScript", dependencies: [], relevanceTags: ["warehouse", "reservation", "stock"], contentExcerpt: "export async function reserveStock(lines) { /* inventory */ }" },
  { path: "modules/notifications/notification-service.ts", module: "notifications", language: "TypeScript", dependencies: [], relevanceTags: ["notification", "order", "failure"], contentExcerpt: "export async function notifyOrderFailure(event) { /* notify */ }" },
];

const fillerModules = ["auth", "profiles", "analytics", "catalog", "reporting", "search", "billing-ui", "admin", "shared"];
const filler: RepositoryFile[] = Array.from({ length: 31 }, (_, index) => {
  const module = fillerModules[index % fillerModules.length];
  return {
    path: `modules/${module}/file-${String(index + 1).padStart(2, "0")}.ts`,
    module,
    language: "TypeScript",
    dependencies: [],
    relevanceTags: [module],
    contentExcerpt: `export const ${module.replace(/-/g, "_")}_${index + 1} = true;`,
  };
});

export const opsCoreRepository: RepositorySnapshot = {
  id: "repo-opscore-v1",
  name: "OpsCore ERP",
  synthetic: true,
  files: [...coreFiles, ...alternateTaskFiles, ...filler],
};

if (opsCoreRepository.files.length !== 42) {
  throw new Error(`Synthetic OpsCore repository must contain exactly 42 files, got ${opsCoreRepository.files.length}.`);
}
