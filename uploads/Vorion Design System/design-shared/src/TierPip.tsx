// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

type Tier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface Props {
  tier: Tier;
  label?: string;
}

const NAMES: Record<Tier, string> = {
  0: 'SANDBOX', 1: 'DECLARED', 2: 'OBSERVED', 3: 'CERTIFIED',
  4: 'ATTESTED', 5: 'TRUSTED', 6: 'PRIVILEGED', 7: 'AUTONOMOUS',
};

export function TierPip({ tier, label }: Props) {
  return (
    <span className="tier-pip" data-tier={tier}>
      T{tier}{label ?? ` · ${NAMES[tier]}`}
    </span>
  );
}
