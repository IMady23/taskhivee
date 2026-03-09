/**
 * Team Management Service
 * Handles all team-related operations with Firebase/Firestore
 * According to TaskHive Feature Specification #3
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { updateProfile } from 'firebase/auth';

/**
 * Generate a unique team identifier (6-character alphanumeric)
 */
const generateTeamId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Create a new team (Leader only)
 * @param {Object} teamData - Team information
 * @param {string} teamData.name - Team name
 * @param {Array} teamData.invitedMembers - Array of invited members with name, email, status
 * @param {string} leaderId - Leader's user ID
 * @param {number} maxSize - Maximum team size (default: 10)
 * @returns {Promise<Object>} Created team data
 */
export const createTeam = async (teamData, leaderId, maxSize = 10) => {
  try {
    const teamId = generateTeamId();

    // Check if team ID already exists (very unlikely but good practice)
    const existingTeam = await getTeamById(teamId);
    if (existingTeam) {
      // Generate new ID if collision occurs
      return createTeam(teamData, leaderId, maxSize);
    }

    // Check for existing team and deactivate it (to free up members)
    const leaderUserDoc = await getDoc(doc(db, 'users', leaderId));
    if (leaderUserDoc.exists()) {
      const leaderData = leaderUserDoc.data();
      if (leaderData.teamId) {
        const oldTeamDocRef = doc(db, 'teams', leaderData.teamId);
        const oldTeamSnap = await getDoc(oldTeamDocRef);

        if (oldTeamSnap.exists()) {
          const oldTeamData = oldTeamSnap.data();
          // Only deactivate if this user was the leader of the old team
          if (oldTeamData.leaderId === leaderId) {
            await updateDoc(oldTeamDocRef, {
              isActive: false,
              updatedAt: serverTimestamp()
            });
            // This allows members of the old team to join the new one (per Fix #10)
          }
        }
      }
    }

    const team = {
      name: teamData.name,
      teamId: teamId,
      leaderId: leaderId,
      primaryLeaderId: leaderId, // 🆕 NEW: Set primary leader for authority hierarchy
      members: [leaderId], // Leader is automatically a member
      invitedMembers: teamData.invitedMembers || [], // Store invited members
      maxSize: maxSize,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true
    };

    const docRef = await addDoc(collection(db, 'teams'), team);

    // Update user's teamId
    await updateDoc(doc(db, 'users', leaderId), {
      teamId: docRef.id,
      updatedAt: serverTimestamp()
    });

    // Get leader's name for emails
    let leaderName = 'Team Leader';
    try {
      const leaderDoc = await getDoc(doc(db, 'users', leaderId));
      if (leaderDoc.exists()) {
        leaderName = leaderDoc.data().name || leaderDoc.data().email;
      }
    } catch (e) {
      console.warn('Could not fetch leader name for emails');
    }

    // Phase 7: Send invitations to all initial invited members
    if (teamData.invitedMembers && teamData.invitedMembers.length > 0) {
      const { API_BASE_URL } = await import('../config.js');

      // Send emails in parallel (non-blocking for team creation)
      Promise.all(teamData.invitedMembers.map(member => {
        if (!member.email) return Promise.resolve();

        return fetch(`${API_BASE_URL}/email/team-invitation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: member.email,
            name: member.name || 'Member',
            teamName: teamData.name,
            leaderName: leaderName,
            teamCode: teamId
          })
        }).catch(err => console.warn('Failed to send invite to', member.email, err));
      }));
    }

    return {
      id: docRef.id,
      ...team,
      teamId: teamId
    };
  } catch (error) {
    console.error('Error creating team:', error);
    throw new Error('Failed to create team');
  }
};

/**
 * Get team by team identifier
 * @param {string} teamId - Team identifier
 * @returns {Promise<Object|null>} Team data or null if not found
 */
export const getTeamById = async (teamId) => {
  try {
    const q = query(
      collection(db, 'teams'),
      where('teamId', '==', teamId.toUpperCase()),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const teamDoc = querySnapshot.docs[0];
    return {
      id: teamDoc.id,
      ...teamDoc.data()
    };
  } catch (error) {
    console.error('Error getting team by ID:', error);
    throw new Error('Failed to find team');
  }
};

/**
 * Get team by document ID
 * @param {string} docId - Team document ID
 * @returns {Promise<Object|null>} Team data or null if not found
 */
export const getTeamByDocId = async (docId) => {
  try {
    const teamDoc = await getDoc(doc(db, 'teams', docId));

    if (!teamDoc.exists()) {
      return null;
    }

    return {
      id: teamDoc.id,
      ...teamDoc.data()
    };
  } catch (error) {
    console.error('Error getting team by doc ID:', error);
    throw new Error('Failed to get team');
  }
};

/**
 * Add member to team using team identifier
 * @param {string} teamId - Team identifier
 * @param {string} userId - User ID who wants to join
 * @returns {Promise<Object>} Updated team data
 */
export const addMemberToTeam = async (teamId, userId) => {
  try {
    const team = await getTeamById(teamId);

    if (!team) {
      throw new Error('Invalid team identifier');
    }

    // Check if user is already in a team
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    if (userData.teamId && userData.teamId !== team.id) {
      // Check if the OLD team is actually active.
      // If it's deleted/inactive, we should allow them to leave it implicitely and join the new one.
      try {
        const oldTeamDoc = await getDoc(doc(db, 'teams', userData.teamId));
        if (oldTeamDoc.exists() && oldTeamDoc.data().isActive) {
          throw new Error('You are already in another team');
        }
        // If oldTeamDoc doesn't exist OR is not active, we proceed (overwriting teamId).
      } catch (err) {
        // If error fetching old team, safe to assume we should block or warn?
        // Actually, if we can't verify, we might block. 
        // But usually this means data corruption. Let's assume strict check:
        if (err.message !== 'You are already in another team') {
          console.warn("Could not verify old team status, assuming active.", err);
          // Optional: throw new Error('You are already in another team');
        }
        throw err;
      }
    }

    // Check if team is full
    if (team.members.length >= team.maxSize) {
      throw new Error('Team is full');
    }

    // Check if user is already in this team
    if (team.members.includes(userId)) {
      throw new Error('You are already in this team');
    }

    // Check for and remove from invitedMembers if present (Clean up "Pending" status)
    // --- DEBUG: LOG ALL INVITED MEMBERS ---
    console.log('[TeamService] Team invitedMembers:', team.invitedMembers);
    console.log('[TeamService] User email from userDoc:', userData.email);
    console.log('[TeamService] Normalized user email:', userData.email?.trim().toLowerCase());

    // Email normalization helper
    const normalizeEmail = (email) => email?.trim().toLowerCase().normalize('NFKC') || '';

    const userEmail = normalizeEmail(userData.email);

    // Find invitation with detailed logging
    const invitation = (team.invitedMembers || []).find(m => {
      const invitedEmail = normalizeEmail(m.email);
      console.log(`[TeamService] Comparing: "${invitedEmail}" === "${userEmail}"`);
      return invitedEmail === userEmail;
    });

    console.log('[TeamService] Invitation found:', invitation);

    const updatedInvitedMembers = (team.invitedMembers || []).filter(m => {
      const invitedEmail = normalizeEmail(m.email);
      return invitedEmail !== userEmail;
    });

    // Add user to team & Update invited list
    await updateDoc(doc(db, 'teams', team.id), {
      members: arrayUnion(userId),
      invitedMembers: updatedInvitedMembers, // Force update the list
      updatedAt: serverTimestamp()
    });

    // Update user's teamId AND Name if provided in invitation
    const userUpdates = {
      teamId: team.id,
      updatedAt: serverTimestamp()
    };

    // CRITICAL FIX: Always update name from invitation if it exists
    // This ensures re-invited users get the new name
    if (invitation && invitation.name) {
      userUpdates.name = invitation.name;
      console.log(`[TeamService] Updating user name from invitation: ${invitation.name}`);

      // Update role if invitation has it
      if (invitation.role) {
        userUpdates.role = invitation.role;
        console.log(`[TeamService] Updating user role from invitation: ${invitation.role}`);
      }

      // 🚀 NEW: Sync Firebase Auth displayName with Firestore
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await updateProfile(currentUser, { displayName: invitation.name });
          console.log(`[TeamService] Auth displayName updated to: ${invitation.name}`);
        } catch (authError) {
          console.warn('Failed to update Auth profile:', authError);
        }
      }
    }

    // Update user document with error handling
    try {
      await updateDoc(doc(db, 'users', userId), userUpdates);
      console.log('[TeamService] User document updated successfully with:', userUpdates);
    } catch (userUpdateError) {
      console.error('[TeamService] FAILED to update user document:', userUpdateError);
      throw new Error('Failed to update user profile');
    }

    // Force refresh the user document to ensure name is updated
    const refreshedUserDoc = await getDoc(doc(db, 'users', userId));
    const refreshedUserData = refreshedUserDoc.data();
    console.log(`[TeamService] User profile after update:`, refreshedUserData);

    // Feature 4: Notify Leader when member joins
    if (team.leaderId && team.leaderId !== userId) {
      console.log(`[TeamService] Notifying leader ${team.leaderId} of member ${userId} join`);

      // Use the UPDATED name from the refreshed data
      const userName = refreshedUserData.name || refreshedUserData.email || 'A new member';

      try {
        const { notifyMemberJoined } = await import('./notificationService');
        await notifyMemberJoined(userName, team.leaderId, team.id);
      } catch (notifError) {
        console.warn('⚠️ Member join notification failed:', notifError);
      }
    }

    return {
      ...team,
      members: [...team.members, userId]
    };
  } catch (error) {
    console.error('Error adding member to team:', error);
    throw error;
  }
};

export const getTeamMembers = async (teamDocId) => {
  try {
    const team = await getTeamByDocId(teamDocId);

    if (!team) {
      throw new Error('Team not found');
    }

    if (!team.members || team.members.length === 0) {
      return [];
    }

    // Get all member details
    // Using simple Promise.all mapping for now as it matches the style and scale
    const memberPromises = team.members.map(async (memberId) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', memberId));
        if (userDoc.exists()) {
          return {
            id: memberId,
            ...userDoc.data()
          };
        }
        return null; // Handle case where user doc might be missing
      } catch (e) {
        console.warn(`Failed to fetch user ${memberId}`, e);
        return null;
      }
    });

    const members = await Promise.all(memberPromises);
    return members.filter(member => member !== null);

  } catch (error) {
    console.error('Error getting team members:', error);
    // Return empty array instead of throwing to prevent dashboard crash
    return [];
  }
};

/**
 * Subscribe to team members (Real-time)
 * Single Source of Truth: 'users' collection where teamId matches
 */
export const subscribeToTeamMembers = (teamId, callback) => {
  if (!teamId) return () => { };

  // onSnapshot is imported at top level

  try {
    const q = query(
      collection(db, 'users'),
      where('teamId', '==', teamId)
      // Remove orderBy if it causes index issues, or ensure (teamId, name/createdAt) index exists
    );

    return onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      callback(members);
    }, (error) => {
      console.error("Error subscribing to team members:", error);
      callback([]);
    });
  } catch (error) {
    console.error("Error setting up member subscription:", error);
    return () => { };
  }
};


/**
 * Remove member from team (Leader only)
 * @param {string} teamDocId - Team document ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<Object>} Updated team data
 */
export const removeMember = async (teamDocId, userId) => {
  try {
    const team = await getTeamByDocId(teamDocId);

    if (!team) {
      throw new Error('Team not found');
    }

    // Check if user is in the team
    if (!team.members.includes(userId)) {
      throw new Error('User is not in this team');
    }

    // Remove user from team
    await updateDoc(doc(db, 'teams', teamDocId), {
      members: arrayRemove(userId),
      updatedAt: serverTimestamp()
    });

    // Remove teamId from user
    await updateDoc(doc(db, 'users', userId), {
      teamId: null,
      updatedAt: serverTimestamp()
    });

    return {
      ...team,
      members: team.members.filter(id => id !== userId)
    };
  } catch (error) {
    console.error('Error removing member:', error);
    throw error;
  }
};

/**
 * Join team using team identifier (Member only)
 * @param {string} teamCode - Team identifier code
 * @param {string} userId - User ID who wants to join
 * @returns {Promise<Object>} Updated team data
 */
export const joinTeam = async (teamCode, userId) => {
  try {
    return await addMemberToTeam(teamCode, userId);
  } catch (error) {
    console.error('Error joining team:', error);
    throw error;
  }
};

/**
 * View individual member participation (placeholder for future implementation)
 * @param {string} memberId - Member ID
 * @returns {Promise<Object>} Member participation data
 */
export const getMemberParticipation = async (memberId) => {
  // Placeholder for future implementation
  // Will track tasks completed, bugs reported, etc.
  return {
    memberId,
    tasksCompleted: 0,
    bugsReported: 0,
    lastActive: new Date()
  };
};

/**
 * Update team details (Leader only)
 * @param {string} teamDocId - Team document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated team data
 */
export const updateTeam = async (teamDocId, updates) => {
  try {
    const teamRef = doc(db, 'teams', teamDocId);

    await updateDoc(teamRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    const updatedDoc = await getDoc(teamRef);
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    console.error('Error updating team:', error);
    throw new Error('Failed to update team');
  }
};

/**
 * Delete team (Leader only)
 * @param {string} teamDocId - Team document ID
 * @returns {Promise<void>}
 */
export const deleteTeam = async (teamDocId) => {
  try {
    const team = await getTeamByDocId(teamDocId);

    if (!team) {
      throw new Error('Team not found');
    }

    // Remove teamId from all members
    const memberPromises = team.members.map(async (memberId) => {
      await updateDoc(doc(db, 'users', memberId), {
        teamId: null,
        updatedAt: serverTimestamp()
      });
    });

    await Promise.all(memberPromises);

    // Soft delete the team
    await updateDoc(doc(db, 'teams', teamDocId), {
      isActive: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    throw new Error('Failed to delete team');
  }
};

/**
 * Add invited member to team
 * @param {string} teamDocId - Team document ID
 * @param {Object} memberData - Member data {name, email}
 * @returns {Promise<Object>} Updated team data
 */
export const addInvitedMember = async (teamDocId, memberData) => {
  try {
    const team = await getTeamByDocId(teamDocId);

    if (!team) {
      throw new Error('Team not found');
    }

    // Email normalization helper
    const normalizeEmail = (email) => email?.trim().toLowerCase().normalize('NFKC') || '';

    const newInvitedMember = {
      name: memberData.name,
      email: normalizeEmail(memberData.email), // Normalize when storing
      role: memberData.role || 'Member', // TaskHive Feature Enhancement: Roles
      status: 'invited',
      invitedAt: new Date()
    };

    console.log('[TeamService] Adding invited member:', newInvitedMember);

    await updateDoc(doc(db, 'teams', teamDocId), {
      invitedMembers: arrayUnion(newInvitedMember),
      updatedAt: serverTimestamp()
    });

    // Send invitation email
    try {
      const { API_BASE_URL } = await import('../config.js');
      // Fetch leader name if not in team object (it should be though if created consistently)
      let leaderName = 'Team Leader';
      if (team.leaderName) {
        leaderName = team.leaderName;
      } else if (team.leaderId) {
        // Fallback fetch
        const leaderDoc = await getDoc(doc(db, 'users', team.leaderId));
        if (leaderDoc.exists()) leaderName = leaderDoc.data().name || leaderDoc.data().email;
      }

      await fetch(`${API_BASE_URL}/email/team-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: memberData.email,
          name: memberData.name || 'Member',
          role: memberData.role || 'Member',
          teamName: team.name,
          leaderName: leaderName,
          teamCode: team.teamId // Using teamId as the join code
        })
      });
    } catch (emailError) {
      console.warn('Failed to send invite email:', emailError);
      // Don't throw, just log. The member is added.
    }

    return {
      ...team,
      invitedMembers: [...(team.invitedMembers || []), newInvitedMember]
    };
  } catch (error) {
    console.error('Error adding invited member:', error);
    throw new Error('Failed to add invited member');
  }
};

/**
 * Remove invited member from team
 * @param {string} teamDocId - Team document ID
 * @param {string} memberEmail - Member email to remove
 * @returns {Promise<Object>} Updated team data
 */
export const removeInvitedMember = async (teamDocId, memberEmail) => {
  try {
    const team = await getTeamByDocId(teamDocId);

    if (!team) {
      throw new Error('Team not found');
    }

    const memberToRemove = team.invitedMembers?.find(m => m.email === memberEmail);

    if (memberToRemove) {
      await updateDoc(doc(db, 'teams', teamDocId), {
        invitedMembers: arrayRemove(memberToRemove),
        updatedAt: serverTimestamp()
      });
    }

    return {
      ...team,
      invitedMembers: team.invitedMembers?.filter(m => m.email !== memberEmail) || []
    };
  } catch (error) {
    console.error('Error removing invited member:', error);
    throw new Error('Failed to remove invited member');
  }
};

/**
 * Join team as a co-leader (Leadership Transition)
 * @param {string} userId - New leader's user ID
 * @param {string} teamCode - Team identifier code
 */
export const joinTeamAsLeader = async (userId, teamCode) => {
  try {
    const team = await getTeamById(teamCode);
    if (!team) throw new Error('Invalid team code');

    // Ensure primaryLeaderId exists (migration for existing teams)
    const updates = {
      members: arrayUnion(userId),
      updatedAt: serverTimestamp()
    };

    // Set primaryLeaderId if it doesn't exist (backward compatibility)
    if (!team.primaryLeaderId) {
      updates.primaryLeaderId = team.leaderId || team.members[0];
    }
    // DO NOT modify primaryLeaderId if it already exists - preserve original leader

    await updateDoc(doc(db, 'teams', team.id), updates);

    // Update user's teamId and ensure role is 'leader'
    await updateDoc(doc(db, 'users', userId), {
      teamId: team.id,
      role: 'leader', // Ensure co-leader has leader role
      updatedAt: serverTimestamp()
    });

    return team;
  } catch (error) {
    console.error('Error joining as co-leader:', error);
    throw error;
  }
};