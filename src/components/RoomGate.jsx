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

    const normalizedCode = normalizeCode(joinCode);

    if (normalizedCode.length !== 4) {
      return;
    }

    await onJoinRoom({
      nextRoomCode: normalizedCode,
    });
  };

  return (
    <PanelShell
      eyebrow="Room Join / Create"
      title="Create or join"
      description="Use a 4-digit code and start splitting quickly."
      accent="coral"
    >
      <div className="grid gap-4">
        <div className="grid gap-3 rounded-[1.5rem] border border-ink/10 bg-white/75 p-4">
          <p className="text-sm font-semibold text-ink">Create a room</p>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-ink/70">Admin name</span>
            <input
              className="h-12 rounded-2xl border border-ink/10 bg-canvas px-4 text-base outline-none transition focus:border-coral/60 focus:ring-2 focus:ring-coral/20"
              placeholder="Jeet"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="h-12 rounded-2xl border border-ink/10 bg-white px-5 font-semibold text-ink transition hover:translate-y-[-1px] hover:border-coral/40 hover:bg-coral/5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!authReady || isBusy || !name.trim()}
            onClick={handleCreate}
          >
            {busyAction === 'create-room' ? 'Creating room...' : 'Create a new room'}
          </button>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] border border-ink/10 bg-white/75 p-4">
          <p className="text-sm font-semibold text-ink">Join an existing room</p>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-ink/70">Room code</span>
            <input
              className="h-12 rounded-2xl border border-ink/10 bg-canvas px-4 text-base tracking-[0.24em] outline-none transition placeholder:tracking-normal focus:border-moss/60 focus:ring-2 focus:ring-moss/20 sm:text-lg sm:tracking-[0.32em]"
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              value={joinCode}
              onChange={(event) => setJoinCode(normalizeCode(event.target.value))}
            />
          </label>

          <button
            type="button"
            className="h-12 rounded-2xl bg-moss px-5 font-semibold text-white transition hover:translate-y-[-1px] hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!authReady || isBusy || normalizeCode(joinCode).length !== 4}
            onClick={handleJoin}
          >
            {busyAction === 'join-room' ? 'Joining...' : 'Join with code'}
          </button>
        </div>

        <p className="rounded-2xl bg-ink/5 px-4 py-3 text-sm text-ink/65">
          The creator becomes admin and adds members. Everyone else joins with the code and picks
          their name from the room.
        </p>
      </div>
    </PanelShell>
  );
}
