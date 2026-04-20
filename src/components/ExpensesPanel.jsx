import { useEffect, useState } from 'react';
import PanelShell from './PanelShell';
import { formatCurrency } from '../lib/format';

function defaultSplit(participants) {
  return participants.map((participant) => participant.id);
}

export default function ExpensesPanel({
  room,
  authUid,
  busyAction,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitBetween, setSplitBetween] = useState([]);
  const [editingExpenseId, setEditingExpenseId] = useState('');

  useEffect(() => {
    if (!room || room.participants.length === 0) {
      setPaidBy('');
      setSplitBetween([]);
      return;
    }

    const validIds = new Set(room.participants.map((participant) => participant.id));

    setPaidBy((current) => (validIds.has(current) ? current : room.participants[0].id));
    setSplitBetween((current) => {
      const filtered = current.filter((id) => validIds.has(id));
      return filtered.length > 0 ? filtered : defaultSplit(room.participants);
    });
  }, [room]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setEditingExpenseId('');

    if (room?.participants?.length) {
      setPaidBy(room.participants[0].id);
      setSplitBetween(defaultSplit(room.participants));
      return;
    }

    setPaidBy('');
    setSplitBetween([]);
  };

  const toggleParticipant = (participantId) => {
    setSplitBetween((current) => {
      if (current.includes(participantId)) {
        return current.filter((id) => id !== participantId);
      }

      return [...current, participantId];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!description.trim() || !amount || !paidBy || splitBetween.length === 0) {
      return;
    }

    const payload = {
      description: description.trim(),
      amount: Number(amount),
      paidBy,
      splitBetween,
    };

    if (editingExpenseId) {
      await onUpdateExpense(editingExpenseId, payload);
    } else {
      await onAddExpense(payload);
    }

    resetForm();
  };

  const startEditing = (expense) => {
    setEditingExpenseId(expense.id);
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setPaidBy(expense.paidBy);
    setSplitBetween(Array.isArray(expense.splitBetween) ? expense.splitBetween : []);
  };

  return (
    <PanelShell
      eyebrow="Expenses"
      title="Bills"
      description="Add a bill, split it equally, and edit only the bills you created."
      accent="moss"
    >
      {!room ? (
        <p className="rounded-2xl bg-ink/5 px-4 py-3 text-sm text-ink/60">
          Join a room before adding expenses.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink/65">
                {editingExpenseId ? 'Editing your bill' : 'Add a bill'}
              </p>
              {editingExpenseId ? (
                <button
                  type="button"
                  className="text-sm font-semibold text-ink/60"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-ink/70">Description</span>
                <input
                  className="h-12 rounded-2xl border border-ink/10 bg-canvas px-4 text-base outline-none transition focus:border-moss/60 focus:ring-2 focus:ring-moss/20"
                  placeholder="Dinner at BKC"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-ink/70">Amount</span>
                <input
                  className="h-12 rounded-2xl border border-ink/10 bg-canvas px-4 text-base outline-none transition focus:border-moss/60 focus:ring-2 focus:ring-moss/20"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="1850"
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-ink/70">Paid by</span>
              <select
                className="h-12 rounded-2xl border border-ink/10 bg-canvas px-4 text-base outline-none transition focus:border-moss/60 focus:ring-2 focus:ring-moss/20"
                value={paidBy}
                onChange={(event) => setPaidBy(event.target.value)}
              >
                {room.participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-ink/70">Split between</span>
                <button
                  type="button"
                  className="self-start text-sm font-semibold text-moss"
                  onClick={() => setSplitBetween(defaultSplit(room.participants))}
                >
                  Select all
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {room.participants.map((participant) => {
                  const selected = splitBetween.includes(participant.id);
                  return (
                    <button
                      key={participant.id}
                      type="button"
                      className={`flex min-h-[3.5rem] items-center justify-between rounded-[1.35rem] border px-4 py-3 text-left transition ${
                        selected
                          ? 'border-moss/40 bg-moss/10 text-ink'
                          : 'border-ink/10 bg-white text-ink/70'
                      }`}
                      onClick={() => toggleParticipant(participant.id)}
                    >
                      <span className="font-medium">{participant.name}</span>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                        {selected ? 'Included' : 'Skip'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="h-12 rounded-2xl bg-coral px-5 font-semibold text-white transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                busyAction === 'add-expense' ||
                busyAction === `update-${editingExpenseId}` ||
                !description.trim() ||
                !amount ||
                !paidBy ||
                splitBetween.length === 0
              }
            >
              {editingExpenseId
                ? busyAction === `update-${editingExpenseId}`
                  ? 'Updating bill...'
                  : 'Save changes'
                : busyAction === 'add-expense'
                  ? 'Saving bill...'
                  : 'Add bill'}
            </button>
          </form>

          <div className="grid gap-3">
            {room.expenses.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-ink/15 bg-canvas/60 px-4 py-6 text-sm text-ink/55">
                No expenses yet. Your first bill will appear here immediately for everyone.
              </div>
            ) : (
              room.expenses.map((expense) => (
                <article
                  key={expense.id}
                  className="rounded-[1.5rem] border border-ink/10 bg-white px-4 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{expense.description}</p>
                        {(expense.createdBy ? expense.createdBy === authUid : expense.paidBy === authUid) ? (
                          <span className="rounded-full bg-moss/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-moss">
                            Yours
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-ink/60">
                        Paid by {expense.paidByName} for {expense.splitBetweenNames.join(', ')}
                      </p>
                    </div>
                    <p className="font-display text-xl text-ink sm:text-2xl">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.22em] text-ink/40">
                    Added {expense.createdLabel}
                  </p>
                  {expense.editedLabel ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-ink/35">
                      Updated {expense.editedLabel}
                    </p>
                  ) : null}
                  {(expense.createdBy ? expense.createdBy === authUid : expense.paidBy === authUid) ? (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
                        onClick={() => startEditing(expense)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-coral/25 px-4 py-2 text-sm font-semibold text-coral transition hover:bg-coral/5 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={busyAction === `delete-${expense.id}`}
                        onClick={() => onDeleteExpense(expense.id)}
                      >
                        {busyAction === `delete-${expense.id}` ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </PanelShell>
  );
}
