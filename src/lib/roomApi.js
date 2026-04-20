import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { formatTimestamp } from './format';

function roomRef(roomCode) {
  return doc(db, 'rooms', roomCode);
}

function toMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }

  if (typeof value === 'string' || value instanceof Date) {
    return new Date(value).getTime();
  }

  return 0;
}

function normalizeRoom(rawRoom) {
  const participants = [...(rawRoom.participants || [])].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const participantById = new Map(participants.map((participant) => [participant.id, participant]));
  const expenses = [...(rawRoom.expenses || [])]
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    .map((expense) => ({
      ...expense,
      paidByName: participantById.get(expense.paidBy)?.name || 'Unknown',
      splitBetween: Array.isArray(expense.splitBetween) ? expense.splitBetween : [],
      splitBetweenNames: (Array.isArray(expense.splitBetween) ? expense.splitBetween : [])
        .map((participantId) => participantById.get(participantId)?.name || 'Unknown')
        .sort((a, b) => a.localeCompare(b)),
      createdLabel: formatTimestamp(expense.createdAt),
      editedLabel: expense.editedAt ? formatTimestamp(expense.editedAt) : '',
    }));

  return {
    code: rawRoom.code,
    adminUid: rawRoom.adminUid || '',
    participants,
    expenses,
    createdAt: rawRoom.createdAt,
    updatedAt: rawRoom.updatedAt,
    updatedLabel: formatTimestamp(rawRoom.updatedAt),
  };
}

function sanitizeParticipantName(name) {
  return name.trim().slice(0, 48);
}

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateEntityId(prefix = 'id') {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function canEditExpense(expense, authUid) {
  if (!authUid) {
    return false;
  }

  if (expense.createdBy) {
    return expense.createdBy === authUid;
  }

  return expense.paidBy === authUid;
}

function validateExpensePayload(payload, validIds) {
  const amount = Number(payload.amount);

  if (!payload.description?.trim()) {
    throw new Error('Expense description is required.');
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Expense amount must be greater than zero.');
  }

  if (!payload.paidBy) {
    throw new Error('Select who paid for the expense.');
  }

  if (!validIds.has(payload.paidBy)) {
    throw new Error('The selected payer is no longer in the room.');
  }

  const splitBetween = [...new Set(payload.splitBetween || [])].filter((participantId) =>
    validIds.has(participantId),
  );

  if (splitBetween.length === 0) {
    throw new Error('Pick at least one valid participant in the split.');
  }

  return {
    description: payload.description.trim().slice(0, 80),
    amount: Number(amount.toFixed(2)),
    paidBy: payload.paidBy,
    splitBetween,
  };
}

export async function createRoomWithParticipant({ authUid, displayName }) {
  const participant = {
    id: authUid,
    name: sanitizeParticipantName(displayName),
  };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateRoomCode();
    const ref = roomRef(code);

    try {
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);

        if (snapshot.exists()) {
          throw new Error('ROOM_CODE_EXISTS');
        }

        transaction.set(ref, {
          code,
          adminUid: authUid,
          participants: [participant],
          expenses: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      return code;
    } catch (error) {
      if (error.message === 'ROOM_CODE_EXISTS') {
        continue;
      }

      throw error;
    }
  }

  throw new Error('Unable to generate a unique 4-digit room code. Please try again.');
}

export async function joinRoomByCode({ roomCode }) {
  const ref = roomRef(roomCode);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error(`Room ${roomCode} does not exist.`);
  }
}

export function subscribeToRoom(roomCode, onRoomChange, onError) {
  return onSnapshot(
    roomRef(roomCode),
    (snapshot) => {
      if (!snapshot.exists()) {
        onRoomChange(null);
        return;
      }

      try {
        onRoomChange(normalizeRoom(snapshot.data()));
      } catch (error) {
        onError?.(error);
      }
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function addParticipantToRoom(roomCode, authUid, name) {
  const trimmedName = sanitizeParticipantName(name);

  if (!trimmedName) {
    throw new Error('Participant name cannot be empty.');
  }

  const ref = roomRef(roomCode);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists()) {
      throw new Error('Room not found.');
    }

    const room = snapshot.data();

    if (room.adminUid !== authUid) {
      throw new Error('Only the room admin can add participants.');
    }

    const participants = [...(room.participants || [])];
    const duplicate = participants.some(
      (participant) => participant.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (duplicate) {
      throw new Error(`"${trimmedName}" is already in this room.`);
    }

    participants.push({
      id: generateEntityId('person'),
      name: trimmedName,
    });

    transaction.update(ref, {
      participants,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function removeParticipantFromRoom(roomCode, authUid, participantId) {
  const ref = roomRef(roomCode);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists()) {
      throw new Error('Room not found.');
    }

    const room = snapshot.data();

    if (room.adminUid !== authUid) {
      throw new Error('Only the room admin can remove participants.');
    }

    const expenses = room.expenses || [];
    const isReferenced = expenses.some(
      (expense) =>
        expense.paidBy === participantId ||
        (Array.isArray(expense.splitBetween) && expense.splitBetween.includes(participantId)),
    );

    if (isReferenced) {
      throw new Error('This participant is referenced by an existing expense.');
    }

    transaction.update(ref, {
      participants: (room.participants || []).filter((participant) => participant.id !== participantId),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function addExpenseToRoom(roomCode, payload) {
  const ref = roomRef(roomCode);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists()) {
      throw new Error('Room not found.');
    }

    const room = snapshot.data();
    const participants = room.participants || [];
    const validIds = new Set(participants.map((participant) => participant.id));
    const nextExpense = validateExpensePayload(payload, validIds);

    const expenses = [...(room.expenses || [])];
    expenses.push({
      id: generateEntityId('expense'),
      ...nextExpense,
      createdBy: payload.createdBy || payload.paidBy,
      createdAt: new Date().toISOString(),
    });

    transaction.update(ref, {
      expenses,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function updateExpenseInRoom(roomCode, expenseId, authUid, payload) {
  const ref = roomRef(roomCode);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists()) {
      throw new Error('Room not found.');
    }

    const room = snapshot.data();
    const participants = room.participants || [];
    const validIds = new Set(participants.map((participant) => participant.id));
    const expenses = [...(room.expenses || [])];
    const expenseIndex = expenses.findIndex((expense) => expense.id === expenseId);

    if (expenseIndex < 0) {
      throw new Error('Expense not found.');
    }

    const existingExpense = expenses[expenseIndex];

    if (!canEditExpense(existingExpense, authUid)) {
      throw new Error('You can only edit bills that you created.');
    }

    expenses[expenseIndex] = {
      ...existingExpense,
      ...validateExpensePayload(payload, validIds),
      editedAt: new Date().toISOString(),
    };

    transaction.update(ref, {
      expenses,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function deleteExpenseFromRoom(roomCode, expenseId, authUid) {
  const ref = roomRef(roomCode);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists()) {
      throw new Error('Room not found.');
    }

    const room = snapshot.data();
    const expenses = [...(room.expenses || [])];
    const expense = expenses.find((item) => item.id === expenseId);

    if (!expense) {
      throw new Error('Expense not found.');
    }

    if (!canEditExpense(expense, authUid)) {
      throw new Error('You can only delete bills that you created.');
    }

    transaction.update(ref, {
      expenses: expenses.filter((item) => item.id !== expenseId),
      updatedAt: serverTimestamp(),
    });
  });
}
