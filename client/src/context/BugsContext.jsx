import React, { createContext, useEffect, useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
import * as fs from '../services/firestoreService';

export const BugsContext = createContext();
const STORAGE_KEY = 'taskhive_bugs_v1';
const ACTIVITY_KEY = 'taskhive_activity_v1';




export function BugsProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [bugs, setBugs] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    // If no user, mock empty data or return
    if (!user) {
      setBugs([]);
      setActivity([]);
      return;
    }

    const teamId = user.teamId || user.uid; // Fallback to UID for safety? Or just user.teamId

    const unsub = fs.onBugsByTeam(teamId, (arr) => {
      setBugs(arr || []);
    });

    // Activities
    let actUnsub = null;
    try {
      actUnsub = fs.onTeamMembers(teamId, () => {
        fs.getActivities(teamId).then((act) => setActivity(act || [])).catch(() => setActivity([]));
      });
    } catch (e) {
      setActivity([]);
    }

    return () => {
      if (unsub) unsub();
      if (actUnsub) actUnsub();
    };
  }, [user]);

  const addActivity = async (text) => {
    try {
      const teamId = user?.teamId || user?.uid || 'demo_team';
      await fs.addActivity(teamId, text);
      window.dispatchEvent(new Event('localDataChanged'));
    } catch (e) {
      console.error('addActivity error', e);
    }
  };

  const addBug = async (bug) => {
    try {
      const teamId = user?.teamId || user?.uid || 'demo_team';

      const t = {
        ...bug,
        teamId,
        reportedById: user?.uid,
        reportedByName: user?.name || user?.displayName || user?.email || 'Member',
        reportedByPhotoURL: user?.photoURL || null,
        // Ensure we don't overwrite if bug already has it (though it shouldn't)
        ...((bug.reportedById) && { reportedById: bug.reportedById })
      };

      await fs.reportBug(t);

      const { logActivity } = await import('../services/activityService');
      await logActivity(
        teamId,
        'BUG_REPORTED',
        `Bug '${bug.title}' reported by ${t.reportedByName}`,
        { id: user?.uid, name: t.reportedByName, photoURL: user?.photoURL },
        { targetId: bug.id, targetType: 'BUG' }
      );

      // Notify Leader(s)
      if (user?.teamId) {
        try {
          // Notify Leaders - FIX: Use getUsersByTeam to get user objects with roles
          const members = await fs.getUsersByTeam(teamId);
          const leaders = members.filter(m => m.role === 'leader');
          const { sendNotification } = await import('../services/notificationService');

          for (const leader of leaders) {
            if (leader.id !== user.uid) {
              await sendNotification(
                leader.id || leader.uid,
                teamId,
                'bug_attention', // Red
                'New Bug Reported',
                `${user.name || 'A member'} reported: ${bug.title}`
              );
            }
          }

          // Chat Integration: Post System Message
          const { sendSystemMessage } = await import('../services/chatService');
          await sendSystemMessage(teamId, `🐞 ${t.reportedByName} reported a bug: "${bug.title}"`);
        } catch (notifError) {
          console.warn("Failed to notify/chat about bug", notifError);
        }
      }
    } catch (e) {
      console.error('addBug error', e);
    }
  };

  const updateBug = async (id, updates) => {
    try {
      const prev = bugs.find((b) => b.id === id) || {};
      await fs.updateBug(id, updates);

      const { sendNotification } = await import('../services/notificationService');
      const { sendSystemMessage } = await import('../services/chatService'); // Chat Integration
      const teamId = user?.teamId || user?.uid;

      if (updates.status && updates.status !== prev.status) {
        const { logActivity } = await import('../services/activityService');
        await logActivity(
          teamId,
          'BUG_UPDATED',
          `Bug '${prev.title}' status changed to ${updates.status}`,
          { id: user?.uid, name: user?.name || 'Member', photoURL: user?.photoURL },
          { targetId: id, targetType: 'BUG' }
        );

        // Chat Integration: System Message for Status Change
        try {
          const updaterName = user?.name || 'A member';
          await sendSystemMessage(teamId, `🔧 Bug "${prev.title}" marked ${updates.status} by ${updaterName}`);
        } catch (chatErr) {
          console.warn("Failed to send chat message", chatErr);
        }

        // 1. Notify Reporter if Resolved
        if (updates.status === 'Resolved' && prev.reportedById) {
          await sendNotification(
            prev.reportedById,
            teamId,
            'bug_success', // Green
            'Bug Resolved',
            `Bug ‘${prev.title}’ resolved by ${updaterName}`
          );
        }

        // 2. Notify Leaders if Resolved (Independent of Reporter)
        if (updates.status === 'Resolved') {
          const members = await fs.getUsersByTeam(teamId);
          const leaders = members.filter(m => m.role === 'leader');
          for (const leader of leaders) {
            // Don't notify self $if already the updater
            if (leader.id !== user.uid) {
              await sendNotification(
                leader.id || leader.uid,
                teamId,
                'bug_success', // Green
                'Bug Resolved',
                `Bug ‘${prev.title}’ resolved by ${updaterName}`
              );
            }
          }
        }
      } else {
        const { logActivity } = await import('../services/activityService');
        await logActivity(
          teamId,
          'BUG_UPDATED',
          `Bug '${prev.title}' updated`,
          { id: user?.uid, name: user?.name || 'Member', photoURL: user?.photoURL },
          { targetId: id, targetType: 'BUG' }
        );
      }
    } catch (e) {
      console.error('updateBug error', e);
    }
  };

  const requestBugDeletion = async (bugId, bugTitle) => {
    try {
      const teamId = user?.teamId || user?.uid;
      // Notify Leaders - FIX: Use getUsersByTeam
      const members = await fs.getUsersByTeam(teamId);
      const leaders = members.filter(m => m.role === 'leader');
      const { sendNotification } = await import('../services/notificationService');
      const updaterName = user?.name || 'A member';

      for (const leader of leaders) {
        if (leader.id !== user.uid) {
          await sendNotification(
            leader.id || leader.uid,
            teamId,
            'bug_attention', // Red
            'Deletion Requested',
            `${updaterName} requested to delete bug: ${bugTitle}`
          );
        }
      }
      return true;
    } catch (e) {
      console.error("requestBugDeletion error", e);
      return false;
    }
  };

  const deleteBug = async (id) => {
    try {
      const toDelete = bugs.find((b) => b.id === id);
      const teamId = user?.teamId || user?.uid;

      await fs.updateBug(id, { status: 'Deleted' });

      if (toDelete) {
        const { logActivity } = await import('../services/activityService');
        await logActivity(
          teamId,
          'BUG_DELETED',
          `Bug '${toDelete.title}' deleted`,
          { id: user?.uid, name: user?.name || 'Member', photoURL: user?.photoURL },
          { targetId: id, targetType: 'BUG' }
        );

        // Notify Reporter if it was a leader who deleted it
        if (user?.role === 'leader' && toDelete.reportedById && toDelete.reportedById !== user.uid) {
          const { sendNotification } = await import('../services/notificationService');
          await sendNotification(
            toDelete.reportedById,
            teamId,
            'bug_success', // Green
            'Bug Deleted',
            `Bug ‘${toDelete.title}’ was deleted by Leader`
          );
        }
      }
    } catch (e) {
      console.error('deleteBug error', e);
    }
  };

  return (
    <BugsContext.Provider value={{ bugs, activity, addBug, updateBug, deleteBug, addActivity, requestBugDeletion }}>
      {children}
    </BugsContext.Provider>
  );
}

export default BugsContext;
