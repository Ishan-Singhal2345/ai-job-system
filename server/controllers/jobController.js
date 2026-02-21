/**
 * controllers/jobController.js — CRUD + AI job description generation
 */

const Job    = require('../models/Job');
const openai = require('../config/openai');

// ── Create job + AI-generate description ─────────────────────
exports.createJob = async (req, res) => {
  try {
    const { title, department, location, type, rawRequirements, experience, salary } = req.body;

    let description = rawRequirements;
    let skills      = [];

    // Call OpenAI to expand the raw requirements into a full JD
    if (rawRequirements) {
      const prompt = `
You are an expert HR recruiter. Based on the following raw job requirements, generate:
1. A professional, compelling job description (3-4 paragraphs).
2. A JSON array of required technical skills (max 10 items).

Raw Requirements: ${rawRequirements}
Job Title: ${title}
Experience Required: ${experience || 'Not specified'}

Respond in JSON format:
{
  "description": "...",
  "skills": ["skill1", "skill2", ...]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 800,
      });

      const parsed = JSON.parse(completion.choices[0].message.content);
      description  = parsed.description || rawRequirements;
      skills       = parsed.skills       || [];
    }

    const job = await Job.create({
      title, department, location, type,
      rawRequirements, description, skills,
      experience, salary,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get all jobs ──────────────────────────────────────────────
exports.getJobs = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) query.title  = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      Job.find(query).populate('createdBy', 'name email').sort({ createdAt: -1 }).skip(skip).limit(+limit),
      Job.countDocuments(query),
    ]);

    res.json({ success: true, total, page: +page, jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get single job ────────────────────────────────────────────
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('createdBy', 'name email');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Update job ────────────────────────────────────────────────
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete job ────────────────────────────────────────────────
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Dashboard stats ───────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [total, active, draft, closed] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Job.countDocuments({ status: 'draft' }),
      Job.countDocuments({ status: 'closed' }),
    ]);

    // Monthly job creation (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthly = await Job.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({ success: true, stats: { total, active, draft, closed }, monthly });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
