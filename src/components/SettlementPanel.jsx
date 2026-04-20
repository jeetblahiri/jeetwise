import PanelShell from './PanelShell';
import { formatCurrency } from '../lib/format';

export default function SettlementPanel({ room, summary }) {
  return (
    <PanelShell
      eyebrow="Settlement Summary"
      title="Who owes whom"
      description="Quick payback suggestions based on the current bills."
      accent="sky"
    >
      {!room ? (
        <p className="rounded-2xl bg-ink/5 px-4 py-3 text-sm text-ink/60">
          Join a room to see balances and settlement suggestions.
        </p>
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-3">
            {summary.balances.length === 0 ? (
              <div className="rounded-2xl bg-canvas px-4 py-4 text-sm text-ink/55">
                Add participants to begin tracking balances.
              </div>
            ) : (
              summary.balances.map((entry) => {
                const tone =
                  entry.balanceCents > 0
                    ? 'text-moss bg-moss/10'
                    : entry.balanceCents < 0
                      ? 'text-coral bg-coral/10'
                      : 'text-ink/60 bg-ink/5';

                return (
                  <div
                    key={entry.id}
                    className="flex flex-col items-start gap-3 rounded-[1.4rem] border border-ink/10 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-ink">{entry.name}</p>
                      <p className="mt-1 text-sm text-ink/55">
                        {entry.balanceCents > 0
                          ? 'Should receive money'
                          : entry.balanceCents < 0
                            ? 'Needs to pay back'
                            : 'Settled up'}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-2 text-sm font-semibold ${tone}`}>
                      {formatCurrency(entry.balance)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="rounded-[1.5rem] bg-ink p-4 text-white sm:rounded-[1.75rem] sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
              Suggested transfers
            </p>

            {summary.settlements.length === 0 ? (
              <p className="mt-3 text-sm text-white/75">
                Everyone is square right now. New expenses will generate suggestions here.
              </p>
            ) : (
              <div className="mt-4 grid gap-3">
                {summary.settlements.map((settlement, index) => (
                  <div
                    key={`${settlement.from}-${settlement.to}-${index}`}
                    className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <p className="font-medium text-white">
                      {settlement.fromName} pays {settlement.toName}
                    </p>
                    <p className="mt-1 font-display text-2xl text-peach">
                      {formatCurrency(settlement.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PanelShell>
  );
}
