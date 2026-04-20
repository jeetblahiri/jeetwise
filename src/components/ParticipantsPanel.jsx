import { useMemo, useState } from 'react';
import PanelShell from './PanelShell';

export default function ParticipantsPanel({
  room,
  authUid,
  busyAction,
  onAddParticipant,
  onRemoveParticipant,
}) {
  const [name, setName] = useState('');

  const protectedParticipants = useMemo(() => {
    if (!room) {
      return new Set();
    }

    const ids = new Set();

    room.expenses.forEach((expense) => {
      ids.add(expense.paidBy);
      expense.splitBetween.forEach((participantId) => ids.add(participantId));
    });

    return ids;
  }, [room]);

  const submitParticipant = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    await onAddParticipant(name.trim());
    setName('');
  };

  return (
    <PanelShell
      eyebrow="Participants"
      title="Manage the people in this room"
      description="Participants are stored directly on the room document. You can remove someone as long as no expense currently references them."
      accent="peach"
    >
      {!room ? (
        <p className="rounded-2xl bg-ink/5 px-4 py-3 text-sm text-ink/60">
          Join a room to start adding your group.
        </p>
      ) : (
        <div className="grid gap-4">
          <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={submitParticipant}>
            <input
              className="h-12 rounded-2xl border border-ink/10 bg-canvas px-4 text-base outline-none transition focus:border-peach/70 focus:ring-2 focus:ring-peach/20"
              placeholder="Add a participant"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button
              type="submit"
              className="h-12 rounded-2xl bg-ink px-5 font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!name.trim() || busyAction === 'add-participant'}
            >
              {busyAction === 'add-participant' ? 'Adding...' : 'Add person'}
            </button>
          </form>

          <div className="grid gap-3">
            {room.participants.map((participant) => {
              const locked = protectedParticipants.has(participant.id);
              const isCurrentUser = participant.id === authUid;

              return (
                <div
                  key={participant.id}
                  className="flex flex-col items-start gap-3 rounded-[1.5rem] border border-ink/10 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{participant.name}</p>
                      {isCurrentUser ? (
                        <span className="rounded-full bg-moss/10 px-2 py-1 text-xs font-semibold text-moss">
                          You
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-ink/45">
                      ID {participant.id.slice(0, 8)}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="w-full rounded-full border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition hover:border-coral/35 hover:bg-coral/5 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                    disabled={locked || busyAction === `remove-${participant.id}`}
                    onClick={() => onRemoveParticipant(participant.id)}
                  >
                    {busyAction === `remove-${participant.id}` ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="rounded-2xl bg-canvas px-4 py-3 text-sm text-ink/60">
            Removal is disabled once a participant is referenced in an expense so historical
            calculations remain consistent.
          </p>
        </div>
      )}
    </PanelShell>
  );
}
