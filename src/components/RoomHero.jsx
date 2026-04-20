import PanelShell from './PanelShell';

export default function RoomHero({
  room,
  currentParticipantId,
  status,
  error,
  isAdmin,
  onLeaveRoom,
}) {
  const currentParticipant = room?.participants.find(
    (participant) => participant.id === currentParticipantId,
  );

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
        <div className="grid gap-4 rounded-[1.5rem] bg-ink p-4 text-white sm:rounded-[1.75rem] sm:p-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              Shareable room code
            </p>
            <p className="mt-2 break-all font-display text-4xl tracking-[0.18em] sm:text-5xl sm:tracking-[0.28em]">
              {room ? room.code : '----'}
            </p>
          </div>
          <div className="grid gap-3 text-sm text-white/70 sm:justify-items-end">
            <p className="max-w-full break-words">{status}</p>
            <button
              type="button"
              className="w-full rounded-full border border-white/15 px-4 py-2 font-medium text-white transition hover:bg-white/10 sm:w-auto"
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
          <div className="grid gap-3 rounded-[1.5rem] border border-ink/10 bg-canvas/80 p-4 sm:rounded-[1.75rem] sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">
                You are
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {currentParticipant ? currentParticipant.name : 'Choose your name'}
              </p>
              {isAdmin ? (
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">
                  Room admin
                </p>
              ) : null}
            </div>
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
          </div>
        ) : null}
      </div>
    </PanelShell>
  );
}
