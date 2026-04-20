export function normalizeFirebaseError(error, fallbackMessage) {
  const rawMessage = error?.message || '';
  const errorCode = error?.code || '';

  if (
    rawMessage.includes('Cloud Firestore API has not been used') ||
    rawMessage.includes('firestore.googleapis.com')
  ) {
    return (
      'Cloud Firestore is not enabled for project jeetwise-c6df5 yet. ' +
      'Open Firebase Console -> Build -> Firestore Database, create the database or enable the API, ' +
      'wait 2 to 5 minutes, then try again.'
    );
  }

  if (
    rawMessage.includes('The database (default) does not exist') ||
    errorCode === 'failed-precondition'
  ) {
    return (
      'Firestore exists in your app config, but the default database has not been created yet. ' +
      'Creating Realtime Database does not fix this app because jeetwise uses Cloud Firestore. ' +
      'Open Firebase Console -> Build -> Firestore Database and create the default Firestore database first.'
    );
  }

  if (errorCode === 'permission-denied') {
    return (
      'Firestore rejected this request. Publish your Firestore rules and make sure authenticated users ' +
      'can read and write the rooms collection.'
    );
  }

  if (errorCode === 'unauthenticated') {
    return (
      'Firebase auth is not ready for this request. Refresh the page and make sure Anonymous Auth is enabled ' +
      'and the current site domain is added to Authorized domains in Firebase Authentication.'
    );
  }

  if (errorCode === 'unavailable') {
    return 'Firebase is temporarily unavailable. Check your connection and retry in a moment.';
  }

  return rawMessage || fallbackMessage;
}
