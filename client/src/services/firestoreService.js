import { db } from '../config/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';

/**
 * Firestore helper functions for tasks, bugs, teams and activity.
 * Functions prefer `teamId` as document id for team-level scoping.
 */

// Tasks
/**
 * Create a task document in the `tasks` collection.
 * @param {Object} task - Task payload (e.g., title, description, teamId, assignedTo)
 * @returns {Promise<Object>} Created task object including `id` and timestamps
 */
export const createTask = async (task) => {
  const { id, ...taskData } = task; // Remove temp ID
  const payload = {
    ...taskData,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'tasks'), payload);
  // Return a canonical object resembling existing local model
  const snap = await getDoc(ref);
  return { id: ref.id, ...snap.data() };
};

/**
 * Update a task by document id.
 * @param {string} id - Task document id
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated task object
 */
export const updateTask = async (id, updates) => {
  const ref = doc(db, 'tasks', id);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() };
};

/**
 * Delete a task by id.
 * @param {string} id - Task document id
 * @returns {Promise<boolean>} True when deletion succeeds
 */
export const deleteTaskById = async (id) => {
  await deleteDoc(doc(db, 'tasks', id));
  return true;
};

/**
 * Subscribe to tasks for a given team.
 * @param {string} teamId - Team identifier
 * @param {(tasks: Array<Object>) => void} cb - Callback invoked with array of tasks
 * @returns {Function} Unsubscribe function
 */
export const onTasksByTeam = (teamId, cb) => {
  const q = query(collection(db, 'tasks'), where('teamId', '==', teamId), orderBy('createdAt', 'desc'));
  const unsub = onSnapshot(q, (snapshot) => {
    const arr = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
    cb(arr);
  }, (err) => {
    console.error('Tasks onSnapshot error:', err);
    cb([]);
  });
  return unsub;
};

/**
 * Get tasks assigned to a specific member within a team.
 * @param {string} teamId
 * @param {string} memberName
 * @returns {Promise<Array<Object>>} Array of task objects
 */
export const getTasksByMember = async (teamId, memberName) => {
  const q = query(collection(db, 'tasks'), where('teamId', '==', teamId), where('assignedTo', '==', memberName));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Bugs
/**
 * Report a bug by creating a document in `bugs` collection.
 * @param {Object} bug - Bug payload (e.g., title, description, teamId, reportedBy)
 * @returns {Promise<Object>} Created bug object
 */
export const reportBug = async (bug) => {
  const { id, ...bugData } = bug; // Remove temp ID
  const payload = { ...bugData, createdAt: serverTimestamp() };
  const ref = await addDoc(collection(db, 'bugs'), payload);
  const snap = await getDoc(ref);
  return { id: ref.id, ...snap.data() };
};

/**
 * Update a bug by id.
 * @param {string} id - Bug document id
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated bug object
 */
export const updateBug = async (id, updates) => {
  const ref = doc(db, 'bugs', id);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() };
};

/**
 * Subscribe to bugs for a team.
 * @param {string} teamId
 * @param {(bugs: Array<Object>) => void} cb
 * @returns {Function} Unsubscribe function
 */
export const onBugsByTeam = (teamId, cb) => {
  const q = query(collection(db, 'bugs'), where('teamId', '==', teamId), orderBy('createdAt', 'desc'));
  const unsub = onSnapshot(q, (snapshot) => {
    const arr = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
    cb(arr);
  }, (err) => {
    console.error('Bugs onSnapshot error:', err);
    cb([]);
  });
  return unsub;
};

// Teams
/**
 * Return a DocumentReference for the team.
 * @param {string} teamId
 * @returns {import('firebase/firestore').DocumentReference}
 */
export const getTeamDocRef = (teamId) => doc(db, 'teams', teamId);

/**
 * Get team members array.
 * @param {string} teamId
 * @returns {Promise<Array<Object>>} Members array (empty array if none)
 */
export const getTeamMembers = async (teamId) => {
  const ref = getTeamDocRef(teamId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const data = snap.data();
  return data.members || [];
};

/**
 * Listen for updates to team members.
 * @param {string} teamId
 * @param {(members: Array<Object>) => void} cb
 * @returns {Function} Unsubscribe function
 */
export const onTeamMembers = (teamId, cb) => {
  const ref = getTeamDocRef(teamId);
  const unsub = onSnapshot(ref, (snapshot) => {
    if (!snapshot.exists()) return cb([]);
    const data = snapshot.data();
    cb(data.members || []);
  }, (err) => {
    console.error('Team onSnapshot error:', err);
    cb([]);
  });
  return unsub;
};

/**
 * Add a member to a team (creates team doc if missing).
 * @param {string} teamId
 * @param {Object} member
 * @returns {Promise<Array<Object>>} Updated members array
 */
export const addTeamMember = async (teamId, member) => {
  const ref = getTeamDocRef(teamId);
  // create doc if missing
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { members: [member], leaderId: teamId, createdAt: serverTimestamp() });
    return [member];
  }
  await updateDoc(ref, { members: arrayUnion(member) });
  const updated = await getDoc(ref);
  return updated.data().members || [];
};

/**
 * Remove a team member by name.
 * @param {string} teamId
 * @param {string} memberName
 * @returns {Promise<Array<Object>>} Updated members array
 */
export const removeTeamMember = async (teamId, memberName) => {
  const ref = getTeamDocRef(teamId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const members = (snap.data().members || []).filter((m) => m.name !== memberName);
  await updateDoc(ref, { members });
  return members;
};

// Users
/**
 * Create or update a user document by uid.
 * @param {string} uid - Firebase Auth uid
 * @param {Object} user - User fields to set/merge
 * @returns {Promise<Object>} User document object
 */
export const createOrUpdateUser = async (uid, user) => {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { ...user, updatedAt: serverTimestamp() }, { merge: true });
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() };
};

/**
 * Get a user document by uid.
 * @param {string} uid
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const getUserById = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

/**
 * Update user fields.
 * @param {string} uid
 * @param {Object} updates
 * @returns {Promise<Object>} Updated user object
 */
export const updateUser = async (uid, updates) => {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() };
};

/**
 * Update user profile (wrapper for updateUser for bio/photo/badges).
 * @param {string} uid 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export const updateUserProfile = async (uid, data) => {
  return await updateUser(uid, data);
};

/**
 * Subscribe to realtime updates for a user.
 * @param {string} uid
 * @param {(user: Object|null) => void} cb
 * @returns {Function} Unsubscribe function
 */
export const onUser = (uid, cb) => {
  const ref = doc(db, 'users', uid);
  const unsub = onSnapshot(ref, (snapshot) => {
    if (!snapshot.exists()) return cb(null);
    cb({ id: snapshot.id, ...snapshot.data() });
  }, (err) => {
    console.error('User onSnapshot error:', err);
    cb(null);
  });
  return unsub;
};

/**
 * List users by teamId.
 * @param {string} teamId
 * @returns {Promise<Array<Object>>}
 */
export const getUsersByTeam = async (teamId) => {
  const q = query(collection(db, 'users'), where('teamId', '==', teamId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Activity
/**
 * Append a simple activity entry to a team's activity array.
 * @param {string} teamId
 * @param {string} text - Activity text
 * @returns {Promise<void>}
 */
export const addActivity = async (teamId, text) => {
  const ref = doc(db, 'teams', teamId);
  await updateDoc(ref, { activity: arrayUnion({ id: String(Date.now()) + Math.random().toString(36).slice(2, 7), text, date: new Date() }) });
};

/**
 * Read activity array for a team.
 * @param {string} teamId
 * @returns {Promise<Array<Object>>} Activity entries
 */
export const getActivities = async (teamId) => {
  const ref = getTeamDocRef(teamId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  return snap.data().activity || [];
};

export default {
  createTask,
  updateTask,
  deleteTaskById,
  onTasksByTeam,
  getTasksByMember,
  reportBug,
  updateBug,
  onBugsByTeam,
  getTeamMembers,
  onTeamMembers,
  addTeamMember,
  removeTeamMember,
  // Users
  createOrUpdateUser,
  getUserById,
  updateUser,
  updateUserProfile,
  onUser,
  getUsersByTeam,
  // Activity
  addActivity,
  getActivities,
};
