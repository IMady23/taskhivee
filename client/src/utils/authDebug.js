/**
 * Diagnostic helper for Firebase sign-in
 *
 * Usage (in app code or browser console from a module-aware context):
 * import { diagnoseSignIn } from '../utils/authDebug';
 * diagnoseSignIn('email@example.com', 'password123').then(console.log).catch(console.error);
 *
 * The function returns an object: { success: boolean, result?, error? }
 * where `error` includes `code`, `message`, `customData`, `tokenResponse`, `httpResponse`, and the raw `raw` error.
 */

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Attempt to sign in and return detailed error info on failure.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} Diagnostic result
 */
export async function diagnoseSignIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.info('diagnoseSignIn: success', userCredential);
    return { success: true, result: userCredential };
  } catch (err) {
    const code = err?.code || null;
    const message = err?.message || null;
    const customData = err?.customData || null;
    // Some SDK errors include a _tokenResponse or _serverResponse with more details
    const tokenResponse = customData?._tokenResponse || null;
    const httpResponse = customData?._serverResponse || customData?._httpResponse || null;

    const errorInfo = {
      code,
      message,
      customData,
      tokenResponse,
      httpResponse,
      raw: err,
    };

    console.error('diagnoseSignIn: failed', errorInfo);
    return { success: false, error: errorInfo };
  }
}

export default diagnoseSignIn;
