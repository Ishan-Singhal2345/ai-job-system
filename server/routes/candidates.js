/**
 * routes/candidates.js — Candidate management routes
 */

const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createCandidate,
  getCandidates,
  getCandidate,
  updateCandidate,
  deleteCandidate,
  getStats,
} = require('../controllers/candidateController');

router.get('/stats', protect, getStats);

router.route('/')
  .get(protect, getCandidates)
  .post(protect, upload.single('resume'), createCandidate);

router.route('/:id')
  .get(protect, getCandidate)
  .put(protect, authorize('admin', 'hr'), updateCandidate)
  .delete(protect, authorize('admin', 'hr'), deleteCandidate);

module.exports = router;
