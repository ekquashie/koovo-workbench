import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { ReviewState, ValidationStatus } from "@/integration";
import { REVIEW_STATE_LABEL, VALIDATION_STATUS_LABEL } from "@/lib/labels";

const VALIDATION_TONE: Record<ValidationStatus, BadgeTone> = {
  VALID: "valid",
  NEEDS_ATTENTION: "attention",
  EXCLUDED: "excluded",
};

const REVIEW_TONE: Record<ReviewState, BadgeTone> = {
  NOT_REVIEWED: "neutral",
  REVIEWED: "info",
  NEEDS_CORRECTION: "danger",
};

export const ValidationBadge = ({ status }: { status: ValidationStatus }) => (
  <Badge tone={VALIDATION_TONE[status]}>
    {VALIDATION_STATUS_LABEL[status]}
  </Badge>
);

export const ReviewBadge = ({ state }: { state: ReviewState }) => (
  <Badge tone={REVIEW_TONE[state]}>{REVIEW_STATE_LABEL[state]}</Badge>
);
