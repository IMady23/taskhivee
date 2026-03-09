import React, { createContext, useEffect, useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
import * as fs from '../services/firestoreService';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const TeamContext = createContext();
const STORAGE_KEY = 'teamMembers';
// Mock data removed - using real Firestore data

export function TeamProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!user || !user.teamId) {
      setMembers([]);
      return;
    }

    const q = query(
      collection(db, 'users'),
      where('teamId', '==', user.teamId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const teamMembers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(teamMembers);
    }, (error) => {
      console.error("Error fetching team members:", error);
      setMembers([]);
    });

    return () => unsub();
  }, [user]);

  const addMember = async (m) => {
    try {
      if ((members || []).length >= 5) return;
      const teamId = user?.uid || 'demo_team';
      const updated = await fs.addTeamMember(teamId, m);
      setMembers(updated);
      window.dispatchEvent(new Event('localDataChanged'));
    } catch (e) {
      console.error('addMember error', e);
    }
  };

  const removeMember = async (name) => {
    try {
      const teamId = user?.uid || 'demo_team';
      const updated = await fs.removeTeamMember(teamId, name);
      setMembers(updated);

      // Update tasks assigned to this user to Unassigned
      const tasksFor = await fs.getTasksByMember(teamId, name);
      await Promise.all(tasksFor.map((t) => fs.updateTask(t.id, { assignedTo: 'Unassigned' })));

      window.dispatchEvent(new Event('localDataChanged'));
    } catch (e) {
      console.error('removeMember error', e);
    }
  };

  return (
    <TeamContext.Provider value={{ members, addMember, removeMember }}>
      {children}
    </TeamContext.Provider>
  );
}

export default TeamContext;