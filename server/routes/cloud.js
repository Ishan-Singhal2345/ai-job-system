/**
 * routes/cloud.js — AWS EC2 & S3 routes
 */

const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { protect, authorize } = require('../middleware/auth');
const {
  listInstances,
  startInstance,
  stopInstance,
  listBuckets,
  listObjects,
  uploadToS3,
  deleteObject,
  getSignedUrl,
} = require('../controllers/cloudController');

// Use memory storage for S3 uploads (no temp file on server)
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// EC2
router.get('/ec2/instances',          protect, authorize('admin'), listInstances);
router.post('/ec2/:instanceId/start', protect, authorize('admin'), startInstance);
router.post('/ec2/:instanceId/stop',  protect, authorize('admin'), stopInstance);

// S3
router.get('/s3/buckets',          protect, authorize('admin'), listBuckets);
router.get('/s3/objects',          protect, authorize('admin'), listObjects);
router.post('/s3/upload',          protect, authorize('admin'), memUpload.single('file'), uploadToS3);
router.delete('/s3/object',        protect, authorize('admin'), deleteObject);
router.get('/s3/signed/:key',      protect, authorize('admin'), getSignedUrl);

module.exports = router;
