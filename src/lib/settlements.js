function toCents(value) {
  return Math.round(Number(value || 0) * 100);
}

function fromCents(value) {
  return value / 100;
}

function splitEvenly(totalCents, count) {
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;

  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function calculateRoomSummary(room) {
  if (!room) {
    return {
      balances: [],
      settlements: [],
    };
  }

  const balances = new Map(room.participants.map((participant) => [participant.id, 0]));

  room.expenses.forEach((expense) => {
    const totalCents = toCents(expense.amount);
    const payer = expense.paidBy;
    const splitBetween = Array.isArray(expense.splitBetween) ? expense.splitBetween : [];

    if (splitBetween.length === 0 || !balances.has(payer)) {
      return;
    }

    balances.set(payer, balances.get(payer) + totalCents);

    splitEvenly(totalCents, splitBetween.length).forEach((share, index) => {
      const participantId = splitBetween[index];

      if (!balances.has(participantId)) {
        return;
      }

      balances.set(participantId, balances.get(participantId) - share);
    });
  });

  const balanceRows = room.participants.map((participant) => {
    const balanceCents = balances.get(participant.id) || 0;

    return {
      id: participant.id,
      name: participant.name,
      balanceCents,
      balance: fromCents(balanceCents),
    };
  });

  const creditors = balanceRows
    .filter((entry) => entry.balanceCents > 0)
    .map((entry) => ({ ...entry }))
    .sort((a, b) => b.balanceCents - a.balanceCents);

  const debtors = balanceRows
    .filter((entry) => entry.balanceCents < 0)
    .map((entry) => ({ ...entry }))
    .sort((a, b) => a.balanceCents - b.balanceCents);

  const settlements = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amountCents = Math.min(creditor.balanceCents, Math.abs(debtor.balanceCents));

    settlements.push({
      from: debtor.id,
      fromName: debtor.name,
      to: creditor.id,
      toName: creditor.name,
      amountCents,
      amount: fromCents(amountCents),
    });

    creditor.balanceCents -= amountCents;
    debtor.balanceCents += amountCents;

    if (creditor.balanceCents === 0) {
      creditorIndex += 1;
    }

    if (debtor.balanceCents === 0) {
      debtorIndex += 1;
    }
  }

  return {
    balances: balanceRows.sort((a, b) => a.name.localeCompare(b.name)),
    settlements,
  };
}
