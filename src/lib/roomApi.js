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
      splitBetweenNames: expense.splitBetween
        .map((participantId) => participantById.get(participantId)?.name || 'Unknown')
        .sort((a, b) => a.localeCompare(b)),
      createdLabel: formatTimestamp(expense.createdAt),
    }));

  return {
    code: rawRoom.code,
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

export async function joinRoomByCode({ authUid, roomCode, displayName }) {
  const ref = roomRef(roomCode);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    throw new Error(`Room ${roomCode} does not exist.`);
  }

  await runTransaction(db, async (transaction) => {
    const roomSnapshot = await transaction.get(ref);
    const room = roomSnapshot.data();
    const participants = [...(room.participants || [])];
    const existingIndex = participants.findIndex((participant) => participant.id === authUid);
    const nextParticipant = {
      id: authUid,
      name: sanitizeParticipantName(displayName),
    };

    if (existingIndex >= 0) {
      participants[existingIndex] = nextParticipant;
    } else {
      participants.push(nextParticipant);
    }

    transaction.update(ref, {
      participants,
      updatedAt: serverTimestamp(),
    });
  });
}

export function subscribeToRoom(roomCode, onRoomChange, onError) {
  return onSnapshot(
    roomRef(roomCode),
    (snapshot) => {
      if (!snapshot.exists()) {
        onRoomChange(null);
        return;
      }

      onRoomChange(normalizeRoom(snapshot.data()));
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function addParticipantToRoom(roomCode, name) {
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

export async function removeParticipantFromRoom(roomCode, participantId) {
  const ref = roomRef(roomCode);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists()) {
      throw new Error('Room not found.');
    }

    const room = snapshot.data();
    const expenses = room.expenses || [];
    const isReferenced = expenses.some(
      (expense) =>
        expense.paidBy === participantId || expense.splitBetween.includes(participantId),
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

  if (!payload.splitBetween?.length) {
    throw new Error('Pick at least one participant in the split.');
  }

  const ref = roomRef(roomCode);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists()) {
      throw new Error('Room not found.');
    }

    const room = snapshot.data();
    const participants = room.participants || [];
    const validIds = new Set(participants.map((participant) => participant.id));

    if (!validIds.has(payload.paidBy)) {
      throw new Error('The selected payer is no longer in the room.');
    }

    const splitBetween = [...new Set(payload.splitBetween)].filter((participantId) =>
      validIds.has(participantId),
    );

    if (splitBetween.length === 0) {
      throw new Error('No valid participants found for the split.');
    }

    const expenses = [...(room.expenses || [])];
    expenses.push({
      id: generateEntityId('expense'),
      description: payload.description.trim().slice(0, 80),
      amount: Number(amount.toFixed(2)),
      paidBy: payload.paidBy,
      splitBetween,
      createdAt: new Date().toISOString(),
    });

    transaction.update(ref, {
      expenses,
      updatedAt: serverTimestamp(),
    });
  });
}
