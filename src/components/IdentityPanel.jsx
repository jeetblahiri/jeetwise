import PanelShell from './PanelShell';

export default function IdentityPanel({ room, onSelectParticipant }) {
  return (
    <PanelShell
      eyebrow="Choose Yourself"
      title="Pick your name"
      description="The room admin adds members first. After joining with the room code, choose which person you are."
      accent="peach"
    >
      <div className="grid gap-3">
        {room.participants.map((participant) => (
          <button
            key={participant.id}
            type="button"
            className="flex items-center justify-between rounded-[1.4rem] border border-ink/10 bg-white px-4 py-4 text-left transition hover:border-moss/35 hover:bg-moss/5"
            onClick={() => onSelectParticipant(participant.id)}
          >
            <div>
              <p className="font-semibold text-ink">{participant.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink/40">
                {participant.id === room.adminUid ? 'Admin account' : 'Member account'}
              </p>
            </div>
            <span className="rounded-full bg-ink px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
              Select
            </span>
          </button>
        ))}
      </div>
    </PanelShell>
  );
}
