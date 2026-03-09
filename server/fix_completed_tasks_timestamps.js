/**
 * Migration Script: Add completedAt timestamps to existing completed tasks
 * 
 * This script finds all tasks with status "Done" that don't have a completedAt timestamp
 * and adds one based on the current time or updatedAt field.
 */

import { db, admin } from './config/firebase.js';

async function fixCompletedTasksTimestamps() {
  try {
    console.log('🔍 Finding completed tasks without completedAt timestamps...');
    
    // Get all tasks with status "Done"
    const tasksSnapshot = await db.collection('tasks')
      .where('status', '==', 'Done')
      .get();
    
    console.log(`📊 Found ${tasksSnapshot.size} completed tasks`);
    
    let fixed = 0;
    let alreadyHaveTimestamp = 0;
    const batch = db.batch();
    
    for (const doc of tasksSnapshot.docs) {
      const task = doc.data();
      
      // Check if completedAt already exists
      if (task.completedAt) {
        alreadyHaveTimestamp++;
        continue;
      }
      
      // Add completedAt timestamp
      // Use updatedAt if available, otherwise use current time
      const completedAt = task.updatedAt || admin.firestore.FieldValue.serverTimestamp();
      
      batch.update(doc.ref, {
        completedAt: completedAt
      });
      
      fixed++;
      console.log(`✅ Will add completedAt to task: ${task.title}`);
    }
    
    if (fixed > 0) {
      await batch.commit();
      console.log(`\n✨ Successfully added completedAt timestamps to ${fixed} tasks`);
    } else {
      console.log('\n✨ All completed tasks already have completedAt timestamps');
    }
    
    console.log(`📊 Summary:`);
    console.log(`   - Total completed tasks: ${tasksSnapshot.size}`);
    console.log(`   - Already had timestamp: ${alreadyHaveTimestamp}`);
    console.log(`   - Fixed: ${fixed}`);
    
  } catch (error) {
    console.error('❌ Error fixing timestamps:', error);
    throw error;
  }
}

// Run the migration
fixCompletedTasksTimestamps()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
