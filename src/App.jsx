import { useEffect, useMemo, useState } from 'react';
import { ensureAnonymousSession, firebaseConfigError } from './lib/firebase';
import {
  addExpenseToRoom,
  addParticipantToRoom,
  createRoomWithParticipant,
  joinRoomByCode,
  removeParticipantFromRoom,
  subscribeToRoom,
} from './lib/roomApi';
import { calculateRoomSummary } from './lib/settlements';
import RoomGate from './components/RoomGate';
import ParticipantsPanel from './components/ParticipantsPanel';
import ExpensesPanel from './components/ExpensesPanel';
import SettlementPanel from './components/SettlementPanel';
import RoomHero from './components/RoomHero';

const ROOM_STORAGE_KEY = 'jeetwise:last-room-code';
const NAME_STORAGE_KEY = 'jeetwise:display-name';

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [authUid, setAuthUid] = useState('');
  const [roomCode, setRoomCode] = useState(localStorage.getItem(ROOM_STORAGE_KEY) || '');
  const [displayName, setDisplayName] = useState(localStorage.getItem(NAME_STORAGE_KEY) || '');
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState('Connecting to Firebase...');
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState('');

  useEffect(() => {
    let active = true;

    if (firebaseConfigError) {
      setError(firebaseConfigError);
      setStatus('Firebase setup needs attention.');
      return () => {
        active = false;
      };
    }

    ensureAnonymousSession()
      .then((user) => {
        if (!active) {
          return;
        }

        setAuthUid(user.uid);
        setAuthReady(true);
        setStatus('Anonymous session ready.');
      })
      .catch((sessionError) => {
        if (!active) {
          return;
        }

        setError(sessionError.message || 'Unable to initialize Firebase.');
        setStatus('Firebase setup needs attention.');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authReady || !roomCode) {
      setRoom(null);
      return undefined;
    }

    const unsubscribe = subscribeToRoom(
      roomCode,
      (snapshot) => {
        if (snapshot) {
          setRoom(snapshot);
          setStatus(`Live in room ${snapshot.code}`);
          setError('');
          localStorage.setItem(ROOM_STORAGE_KEY, snapshot.code);
          return;
        }

        setRoom(null);
        setStatus(`Room ${roomCode} is not available.`);
      },
      (subscribeError) => {
        setRoom(null);
        setError(subscribeError.message || 'Unable to subscribe to the room.');
      },
    );

    return unsubscribe;
  }, [authReady, roomCode]);

  const summary = useMemo(() => calculateRoomSummary(room), [room]);

  const handleCreateRoom = async (nextName) => {
    if (!authUid) {
      return;
    }

    setBusyAction('create-room');
    setError('');

    try {
      const createdRoomCode = await createRoomWithParticipant({
        authUid,
        displayName: nextName,
      });

      setDisplayName(nextName);
      setRoomCode(createdRoomCode);
      setStatus(`Created room ${createdRoomCode}`);
      localStorage.setItem(NAME_STORAGE_KEY, nextName);
    } catch (createError) {
      setError(createError.message || 'Unable to create room.');
    } finally {
      setBusyAction('');
    }
  };

  const handleJoinRoom = async ({ nextRoomCode, nextName }) => {
    if (!authUid) {
      return;
    }

    setBusyAction('join-room');
    setError('');

    try {
      await joinRoomByCode({
        authUid,
        roomCode: nextRoomCode,
        displayName: nextName,
      });

      setDisplayName(nextName);
      setRoomCode(nextRoomCode);
      setStatus(`Joined room ${nextRoomCode}`);
      localStorage.setItem(NAME_STORAGE_KEY, nextName);
      localStorage.setItem(ROOM_STORAGE_KEY, nextRoomCode);
    } catch (joinError) {
      setError(joinError.message || 'Unable to join that room.');
    } finally {
      setBusyAction('');
    }
  };

  const handleAddParticipant = async (name) => {
    if (!roomCode) {
      return;
    }

    setBusyAction('add-participant');
    setError('');

    try {
      await addParticipantToRoom(roomCode, name);
    } catch (participantError) {
      setError(participantError.message || 'Unable to add participant.');
    } finally {
      setBusyAction('');
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!roomCode) {
      return;
    }

    setBusyAction(`remove-${participantId}`);
    setError('');

    try {
      await removeParticipantFromRoom(roomCode, participantId);
    } catch (removeError) {
      setError(removeError.message || 'Unable to remove participant.');
    } finally {
      setBusyAction('');
    }
  };

  const handleAddExpense = async (payload) => {
    if (!roomCode) {
      return;
    }

    setBusyAction('add-expense');
    setError('');

    try {
      await addExpenseToRoom(roomCode, payload);
    } catch (expenseError) {
      setError(expenseError.message || 'Unable to add expense.');
    } finally {
      setBusyAction('');
    }
  };

  const handleLeaveRoom = () => {
    setRoomCode('');
    setRoom(null);
    setStatus('Left the room.');
    localStorage.removeItem(ROOM_STORAGE_KEY);
  };

  return (
    <div className="relative overflow-hidden bg-canvas bg-grain">
      <div className="pointer-events-none absolute inset-x-0 top-[-12rem] h-[28rem] rounded-full bg-peach/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-1/3 h-80 w-80 rounded-full bg-sky/25 blur-3xl" />

      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex rounded-full border border-ink/10 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-ink/60 shadow-sm backdrop-blur">
              Real-time shared expenses
            </p>
            <h1 className="font-display text-4xl tracking-tight text-ink sm:text-5xl">
              jeetwise
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-ink/70 sm:text-base">
              A lightweight Splitwise-style room app with Firestore sync, anonymous auth,
              and instant settlement math for group trips, dinners, and house expenses.
            </p>
          </div>

          <div className="rounded-3xl border border-ink/10 bg-white/75 px-4 py-3 shadow-float backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/50">
              Session
            </p>
            <p className="mt-2 font-display text-lg text-ink">
              {authReady ? 'Anonymous Firebase ready' : 'Connecting...'}
            </p>
            <p className="mt-1 text-sm text-ink/60">
              {authUid ? `UID ${authUid.slice(0, 8)}...` : 'Waiting for auth'}
            </p>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
          <div className="space-y-6">
            <RoomGate
              authReady={authReady}
              busyAction={busyAction}
              defaultName={displayName}
              defaultRoomCode={roomCode}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
            />

            <RoomHero
              room={room}
              status={status}
              error={error}
              onLeaveRoom={handleLeaveRoom}
            />
          </div>

          <div className="grid gap-6">
            <section className="grid gap-6 lg:grid-cols-2">
              <ParticipantsPanel
                room={room}
                authUid={authUid}
                busyAction={busyAction}
                onAddParticipant={handleAddParticipant}
                onRemoveParticipant={handleRemoveParticipant}
              />
              <SettlementPanel room={room} summary={summary} />
            </section>

            <ExpensesPanel
              room={room}
              busyAction={busyAction}
              onAddExpense={handleAddExpense}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
