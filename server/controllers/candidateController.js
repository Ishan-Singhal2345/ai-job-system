/**
 * controllers/candidateController.js
 * Handles candidate CRUD, AI resume parsing, and AI job matching
 */

const fs        = require('fs');
const pdfParse  = require('pdf-parse');
const Candidate = require('../models/Candidate');
const Job       = require('../models/Job');
const openai    = require('../config/openai');

// ── Upload & AI-parse resume ──────────────────────────────────
exports.createCandidate = async (req, res) => {
  try {
    const { jobId, name, email, phone, notes } = req.body;

    // Verify job exists
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    let resumePath  = '';
    let parsedResume = {};
    let matchScore   = 0;
    let matchSummary = '';

    if (req.file) {
      resumePath = req.file.path;

      // ── Step 1: Parse PDF text ──
      const dataBuffer = fs.readFileSync(resumePath);
      const pdfData    = await pdfParse(dataBuffer);
      const resumeText = pdfData.text.slice(0, 4000); // token limit

      // ── Step 2: AI parse resume ──
      const parsePrompt = `
Extract structured information from this resume text. Respond in JSON:
{
  "skills":     ["skill1", ...],
  "experience": ["Job Title at Company (years)", ...],
  "education":  ["Degree from University", ...],
  "summary":    "2-sentence professional summary"
}

Resume:
${resumeText}`;

      const parseRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: parsePrompt }],
        response_format: { type: 'json_object' },
        max_tokens: 600,
      });

      parsedResume = JSON.parse(parseRes.choices[0].message.content);

      // ── Step 3: AI match score ──
      const matchPrompt = `
You are an expert recruiter. Score this candidate's resume against the job description on a scale of 0-100.

Job Title: ${job.title}
Required Skills: ${job.skills.join(', ')}
Job Description: ${job.description}

Candidate Skills: ${parsedResume.skills?.join(', ')}
Candidate Experience: ${parsedResume.experience?.join('; ')}
Candidate Education: ${parsedResume.education?.join('; ')}

Respond in JSON:
{
  "score": <number 0-100>,
  "summary": "2-sentence explanation of the score"
}`;

      const matchRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: matchPrompt }],
        response_format: { type: 'json_object' },
        max_tokens: 200,
      });

      const matchData = JSON.parse(matchRes.choices[0].message.content);
      matchScore      = matchData.score   || 0;
      matchSummary    = matchData.summary || '';
    }

    // Increment job applicant counter
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    const candidate = await Candidate.create({
      job: jobId,
      name, email, phone, notes,
      resumePath,
      parsedResume,
      matchScore,
      matchSummary,
    });

    res.status(201).json({ success: true, candidate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get all candidates (optionally filter by job) ─────────────
exports.getCandidates = async (req, res) => {
  try {
    const { jobId, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (jobId)  query.job    = jobId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [candidates, total] = await Promise.all([
      Candidate.find(query)
        .populate('job', 'title department')
        .sort({ matchScore: -1 })
        .skip(skip)
        .limit(+limit),
      Candidate.countDocuments(query),
    ]);

    res.json({ success: true, total, page: +page, candidates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get single candidate ──────────────────────────────────────
exports.getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('job', 'title department description skills');
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json({ success: true, candidate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Update candidate status ───────────────────────────────────
exports.updateCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json({ success: true, candidate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete candidate ──────────────────────────────────────────
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    // Clean up resume file
    if (candidate.resumePath && fs.existsSync(candidate.resumePath)) {
      fs.unlinkSync(candidate.resumePath);
    }

    res.json({ success: true, message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Candidate stats ───────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const statusCounts = await Candidate.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const total    = await Candidate.countDocuments();
    const avgScore = await Candidate.aggregate([
      { $group: { _id: null, avg: { $avg: '$matchScore' } } },
    ]);

    res.json({
      success: true,
      stats: {
        total,
        avgMatchScore: avgScore[0]?.avg?.toFixed(1) || 0,
        byStatus: statusCounts,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
