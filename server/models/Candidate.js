/**
 * models/Candidate.js — Candidate / application schema
 */

const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema(
  {
    // Link to User account (optional — HR can add external candidates)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String },

    // Resume file path (stored locally or on S3)
    resumePath: { type: String },
    resumeUrl:  { type: String },

    // AI-parsed resume content
    parsedResume: {
      skills:     [String],
      experience: [String],
      education:  [String],
      summary:    String,
    },

    // AI matching score against job (0–100)
    matchScore: { type: Number, default: 0 },
    matchSummary: { type: String },

    status: {
      type: String,
      enum: ['applied', 'screening', 'interview', 'offer', 'rejected', 'hired'],
      default: 'applied',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Candidate', CandidateSchema);
