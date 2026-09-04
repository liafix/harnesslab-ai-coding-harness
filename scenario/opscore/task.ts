import type { EngineeringTask } from "../../domain/types";

export const opsCoreTask: EngineeringTask = {
  id: "task-duplicate-invoice-export",
  title: "Prevent duplicate ERP invoice exports",
  request: "Prevent duplicate invoices from being exported to the ERP while preserving retry safety and auditability.",
  businessObjective: "Avoid duplicate ERP records without breaking legitimate retries or audit traceability.",
  acceptanceCriteria: [
    "A business invoice is exported to ERP at most once.",
    "Retrying the same request remains idempotent.",
    "Every export decision produces exactly one audit outcome.",
    "The public invoice API remains backward compatible.",
    "No database migration is introduced for this task.",
  ],
  risk: "HIGH",
};
