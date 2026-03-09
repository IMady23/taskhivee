import app, { auth, db } from '../config/firebase';

// Thin wrapper to provide a predictable import path: `src/firebase/firebase.js`
export { app, auth, db };
export default app;
