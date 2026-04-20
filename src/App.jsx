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
import { normalizeFirebaseError } from './lib/firebaseErrorMessage';
import { safeGetStorage, safeRemoveStorage, safeSetStorage } from './lib/storage';
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
  const [roomCode, setRoomCode] = useState(() => safeGetStorage(ROOM_STORAGE_KEY));
  const [displayName, setDisplayName] = useState(() => safeGetStorage(NAME_STORAGE_KEY));
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState('Connecting to Firebase...');
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [mobileSection, setMobileSection] = useState('room');

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

        setError(normalizeFirebaseError(sessionError, 'Unable to initialize Firebase.'));
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
          safeSetStorage(ROOM_STORAGE_KEY, snapshot.code);
          return;
        }

        setRoom(null);
        setStatus(`Room ${roomCode} is not available.`);
      },
      (subscribeError) => {
        setRoom(null);
        setError(normalizeFirebaseError(subscribeError, 'Unable to subscribe to the room.'));
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
      safeSetStorage(NAME_STORAGE_KEY, nextName);
      setMobileSection('people');
    } catch (createError) {
      setError(normalizeFirebaseError(createError, 'Unable to create room.'));
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
      safeSetStorage(NAME_STORAGE_KEY, nextName);
      safeSetStorage(ROOM_STORAGE_KEY, nextRoomCode);
      setMobileSection('expenses');
    } catch (joinError) {
      setError(normalizeFirebaseError(joinError, 'Unable to join that room.'));
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
      setError(normalizeFirebaseError(participantError, 'Unable to add participant.'));
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
      setError(normalizeFirebaseError(removeError, 'Unable to remove participant.'));
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
      setError(normalizeFirebaseError(expenseError, 'Unable to add expense.'));
    } finally {
      setBusyAction('');
    }
  };

  const handleLeaveRoom = () => {
    setRoomCode('');
    setRoom(null);
    setStatus('Left the room.');
    safeRemoveStorage(ROOM_STORAGE_KEY);
    setMobileSection('room');
  };

  const sectionClasses = (sectionName) =>
    mobileSection === sectionName ? 'block' : 'hidden lg:block';

  return (
    <div className="relative overflow-hidden bg-canvas bg-grain">
      <div className="pointer-events-none absolute inset-x-0 top-[-12rem] h-[28rem] rounded-full bg-peach/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-1/3 h-80 w-80 rounded-full bg-sky/25 blur-3xl" />

      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <header className="mb-5 flex flex-col gap-4 sm:mb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 inline-flex max-w-full rounded-full border border-ink/10 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink/60 shadow-sm backdrop-blur sm:text-xs sm:tracking-[0.28em]">
              Real-time shared expenses
            </p>
            <h1 className="font-display text-[2.35rem] leading-none tracking-tight text-ink sm:text-5xl">
              jeetwise
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70 sm:text-base">
              A lightweight Splitwise-style room app with Firestore sync, anonymous auth,
              and instant settlement math for group trips, dinners, and house expenses.
            </p>
          </div>

          <div className="w-full rounded-3xl border border-ink/10 bg-white/75 px-4 py-3 shadow-float backdrop-blur sm:w-auto sm:min-w-[18rem]">
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

        {room ? (
          <nav className="sticky top-3 z-20 mb-5 flex gap-2 overflow-x-auto rounded-full border border-ink/10 bg-white/80 p-2 shadow-float backdrop-blur lg:hidden">
            {[
              { id: 'room', label: 'Room' },
              { id: 'people', label: 'People' },
              { id: 'expenses', label: 'Expenses' },
              { id: 'settle', label: 'Settle' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={`min-w-fit rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mobileSection === item.id
                    ? 'bg-ink text-white'
                    : 'bg-canvas text-ink/65'
                }`}
                onClick={() => setMobileSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        ) : null}

        <div className="grid gap-5 sm:gap-6 xl:grid-cols-[1.1fr_1.9fr]">
          <div className={`space-y-6 ${sectionClasses('room')}`}>
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
              <div className={sectionClasses('people')}>
                <ParticipantsPanel
                  room={room}
                  authUid={authUid}
                  busyAction={busyAction}
                  onAddParticipant={handleAddParticipant}
                  onRemoveParticipant={handleRemoveParticipant}
                />
              </div>
              <div className={sectionClasses('settle')}>
                <SettlementPanel room={room} summary={summary} />
              </div>
            </section>

            <div className={sectionClasses('expenses')}>
              <ExpensesPanel
                room={room}
                busyAction={busyAction}
                onAddExpense={handleAddExpense}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
