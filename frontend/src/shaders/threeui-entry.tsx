import { DimensionalField, type NeuformIsolatedEffectProps } from "./neuform-isolated/NeuformIsolatedEffects";

export type StructureFlowCollectionProps = NeuformIsolatedEffectProps & {
  variant?: "dimensional-field" | string;
};

export function StructureFlowCollection({
  variant = "dimensional-field",
  ...props
}: StructureFlowCollectionProps) {
  if (variant === "dimensional-field") {
    return <DimensionalField {...props} />;
  }
  return <DimensionalField {...props} />;
}

export { DimensionalField };
