export const patchDiffPreview: Record<string, Record<string, string[]>> = {
  "patch-initial-a4d3f9": {
    "services/invoices/invoice-service.ts": [
      "+ const fingerprint = createInvoiceFingerprint(invoice);",
      "+ const priorExport = await invoiceRepository.findExport(fingerprint);",
      "+ if (priorExport) return priorExport;",
    ],
    "domain/billing/invoice-policy.ts": [
      "+ export const createInvoiceFingerprint = (invoice) => stableInvoiceKey(invoice);",
    ],
    "repositories/invoice.repository.ts": [
      "+ findExport(fingerprint: string): Promise<ExportRecord | null>",
    ],
    "tests/integration/invoice-retry.integration.test.ts": [
      "+ expect(erp.exports).toHaveLength(1);",
      "+ expect(audit.outcomes).toHaveLength(2); // hidden production issue",
    ],
  },
  "patch-fix-c81b22": {
    "services/invoices/invoice-service.ts": [
      "+ const decision = await resolveIdempotentExportDecision(fingerprint);",
      "+ if (decision.existing) return decision.exportRecord;",
      "+ await audit.recordOnce(decision.auditKey);",
    ],
    "tests/integration/invoice-retry.integration.test.ts": [
      "+ expect(erp.exports).toHaveLength(1);",
      "+ expect(audit.outcomes).toHaveLength(1);",
    ],
  },
};
