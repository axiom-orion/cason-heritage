// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 Vorion LLC

interface Props {
  ts: string;
  verdict: 'allow' | 'deny' | 'escalate';
  agent: string;
  description: string;
  hash: string;
  isNew?: boolean;
}

export function ProofRow({ ts, verdict, agent, description, hash, isNew }: Props) {
  return (
    <div className={`proof-row${isNew ? ' new' : ''}`}>
      <span className="dot" />
      <span className="ts">{ts}</span>
      <span className="agent">
        {agent} <span className="desc">{description}</span>
      </span>
      <span className={`verdict ${verdict}`}>{verdict.toUpperCase()}</span>
      <span className="hash">{hash}</span>
      <span>→</span>
    </div>
  );
}
