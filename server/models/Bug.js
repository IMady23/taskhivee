import mongoose from 'mongoose';

/**
 * Bug Model
 * Tracks bugs and issues within projects
 * Fields:
 *   - title: Bug title
 *   - description: Detailed bug description
 *   - reportedBy: User who reported the bug
 *   - assignedTo: User assigned to fix the bug
 *   - severity: Bug severity level
 *   - status: Bug status (open, in-progress, fixed, closed)
 *   - project: Associated project
 *   - reproduction: Steps to reproduce the bug
 *   - resolution: How the bug was fixed
 */
const bugSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'fixed', 'closed'],
    default: 'open',
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  reproduction: {
    type: String,
    default: '',
  },
  resolution: {
    type: String,
    default: '',
  },
  attachments: [
    {
      filename: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

bugSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Bug', bugSchema);
