import { useEffect, useState } from 'react';
import PanelShell from './PanelShell';

function normalizeCode(value) {
  return value.replace(/\D/g, '').slice(0, 4);
}

export default function RoomGate({
  authReady,
  busyAction,
  defaultName,
  defaultRoomCode,
  onCreateRoom,
  onJoinRoom,
}) {
  const [name, setName] = useState(defaultName);
  const [joinCode, setJoinCode] = useState(defaultRoomCode);
  const isBusy = busyAction === 'create-room' || busyAction === 'join-room';

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  useEffect(() => {
    setJoinCode(defaultRoomCode);
  }, [defaultRoomCode]);

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    await onCreateRoom(name.trim());
  };

  const handleJoin = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const normalizedCode = normalizeCode(joinCode);

    if (!trimmedName || normalizedCode.length !== 4) {
      return;
    }

    await onJoinRoom({
      nextName: trimmedName,
      nextRoomCode: normalizedCode,
    });
  };

  return (
    <PanelShell
      eyebrow="Room Join / Create"
      title="Spin up a shared room"
      description="Each room is a single Firestore document keyed by a four-digit code. Join from any device and everyone stays in sync instantly."
      accent="coral"
    >
      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink/70">Your name</span>
          <input
            className="h-12 rounded-2xl border border-ink/10 bg-canvas px-4 outline-none transition focus:border-coral/60 focus:ring-2 focus:ring-coral/20"
            placeholder="Jeet"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-ink/70">Join with room code</span>
            <input
              className="h-12 rounded-2xl border border-ink/10 bg-canvas px-4 text-lg tracking-[0.32em] outline-none transition placeholder:tracking-normal focus:border-moss/60 focus:ring-2 focus:ring-moss/20"
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              value={joinCode}
              onChange={(event) => setJoinCode(normalizeCode(event.target.value))}
            />
          </label>

          <button
            type="button"
            className="mt-auto h-12 rounded-2xl bg-moss px-5 font-semibold text-white transition hover:translate-y-[-1px] hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!authReady || isBusy || !name.trim() || normalizeCode(joinCode).length !== 4}
            onClick={handleJoin}
          >
            {busyAction === 'join-room' ? 'Joining...' : 'Join room'}
          </button>
        </div>

        <button
          type="button"
          className="h-12 rounded-2xl border border-ink/10 bg-white px-5 font-semibold text-ink transition hover:translate-y-[-1px] hover:border-coral/40 hover:bg-coral/5 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!authReady || isBusy || !name.trim()}
          onClick={handleCreate}
        >
          {busyAction === 'create-room' ? 'Creating room...' : 'Create a new room'}
        </button>

        <p className="rounded-2xl bg-ink/5 px-4 py-3 text-sm text-ink/65">
          No login screen needed. Firebase anonymous auth runs behind the scenes and your chosen
          name is used as the participant label in the room.
        </p>
      </div>
    </PanelShell>
  );
}
