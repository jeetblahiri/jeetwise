import PanelShell from './PanelShell';

export default function RoomHero({ room, status, error, onLeaveRoom }) {
  return (
    <PanelShell
      eyebrow="Live Room"
      title={room ? `Room ${room.code}` : 'No room connected yet'}
      description={
        room
          ? 'Share this code with your group. All changes use Firestore listeners, so every participant sees updates immediately.'
          : 'Create or join a room to start tracking participants, expenses, and final settlements.'
      }
      accent="sky"
    >
      <div className="grid gap-4">
        <div className="grid gap-4 rounded-[1.75rem] bg-ink p-5 text-white sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              Shareable room code
            </p>
            <p className="mt-2 font-display text-5xl tracking-[0.28em]">
              {room ? room.code : '----'}
            </p>
          </div>
          <div className="grid gap-3 text-sm text-white/70 sm:justify-items-end">
            <p>{status}</p>
            <button
              type="button"
              className="rounded-full border border-white/15 px-4 py-2 font-medium text-white transition hover:bg-white/10"
              onClick={onLeaveRoom}
            >
              Leave room
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
            {error}
          </div>
        ) : null}

        {room ? (
          <div className="grid gap-3 rounded-[1.75rem] border border-ink/10 bg-canvas/80 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">
                Participants
              </p>
              <p className="mt-2 font-display text-3xl text-ink">{room.participants.length}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">
                Expenses
              </p>
              <p className="mt-2 font-display text-3xl text-ink">{room.expenses.length}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">
                Last updated
              </p>
              <p className="mt-2 text-base font-medium text-ink/80">{room.updatedLabel}</p>
            </div>
          </div>
        ) : null}
      </div>
    </PanelShell>
  );
}
