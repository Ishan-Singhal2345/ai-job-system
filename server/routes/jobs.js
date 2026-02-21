/**
 * routes/jobs.js — Job management routes
 */

const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  getStats,
} = require('../controllers/jobController');

router.get('/stats',       protect, getStats);
router.route('/')
  .get(protect, getJobs)
  .post(protect, authorize('admin', 'hr'), createJob);

router.route('/:id')
  .get(protect, getJob)
  .put(protect, authorize('admin', 'hr'), updateJob)
  .delete(protect, authorize('admin', 'hr'), deleteJob);

module.exports = router;
