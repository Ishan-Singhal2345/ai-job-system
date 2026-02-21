/**
 * models/Job.js — Job requirement schema
 */

const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    department: { type: String, trim: true },
    location: { type: String, trim: true },
    type: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'remote'],
      default: 'full-time',
    },
    // Raw prompt from HR; AI expands this into full description
    rawRequirements: { type: String },
    description: { type: String },       // AI-generated
    skills: [{ type: String }],          // AI-extracted skills list
    experience: { type: String },
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'USD' },
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicantsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', JobSchema);
