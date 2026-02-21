/**
 * controllers/cloudController.js — AWS EC2 & S3 management
 */

const {
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
} = require('@aws-sdk/client-ec2');

const {
  ListBucketsCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');

const { getSignedUrl }      = require('@aws-sdk/s3-request-presigner');
const { ec2Client, s3Client } = require('../config/aws');
const multer                = require('multer');
const path                  = require('path');

const BUCKET = process.env.AWS_S3_BUCKET;

// ════════════════════════════════════════════
//  EC2 Operations
// ════════════════════════════════════════════

// List all EC2 instances
exports.listInstances = async (req, res) => {
  try {
    const data      = await ec2Client.send(new DescribeInstancesCommand({}));
    const instances = [];

    data.Reservations.forEach((r) => {
      r.Instances.forEach((i) => {
        instances.push({
          id:           i.InstanceId,
          type:         i.InstanceType,
          state:        i.State.Name,
          publicIp:     i.PublicIpAddress   || 'N/A',
          privateIp:    i.PrivateIpAddress  || 'N/A',
          launchTime:   i.LaunchTime,
          name:         i.Tags?.find((t) => t.Key === 'Name')?.Value || 'Unnamed',
          az:           i.Placement?.AvailabilityZone,
        });
      });
    });

    res.json({ success: true, count: instances.length, instances });
  } catch (err) {
    res.status(500).json({ message: `EC2 Error: ${err.message}` });
  }
};

// Start an EC2 instance
exports.startInstance = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const data = await ec2Client.send(
      new StartInstancesCommand({ InstanceIds: [instanceId] })
    );
    const state = data.StartingInstances[0].CurrentState.Name;
    res.json({ success: true, instanceId, state });
  } catch (err) {
    res.status(500).json({ message: `EC2 Error: ${err.message}` });
  }
};

// Stop an EC2 instance
exports.stopInstance = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const data = await ec2Client.send(
      new StopInstancesCommand({ InstanceIds: [instanceId] })
    );
    const state = data.StoppingInstances[0].CurrentState.Name;
    res.json({ success: true, instanceId, state });
  } catch (err) {
    res.status(500).json({ message: `EC2 Error: ${err.message}` });
  }
};

// ════════════════════════════════════════════
//  S3 Operations
// ════════════════════════════════════════════

// List all S3 buckets
exports.listBuckets = async (req, res) => {
  try {
    const data = await s3Client.send(new ListBucketsCommand({}));
    res.json({ success: true, buckets: data.Buckets });
  } catch (err) {
    res.status(500).json({ message: `S3 Error: ${err.message}` });
  }
};

// List objects in the configured bucket
exports.listObjects = async (req, res) => {
  try {
    const { prefix = '' } = req.query;
    const data = await s3Client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, MaxKeys: 100 })
    );
    res.json({ success: true, objects: data.Contents || [], bucket: BUCKET });
  } catch (err) {
    res.status(500).json({ message: `S3 Error: ${err.message}` });
  }
};

// Upload file to S3
exports.uploadToS3 = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const key    = `uploads/${Date.now()}-${req.file.originalname}`;
    const params = {
      Bucket:      BUCKET,
      Key:         key,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype,
    };

    await s3Client.send(new PutObjectCommand(params));

    // Generate a signed URL (valid 1 hour)
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: 3600 }
    );

    res.json({ success: true, key, url });
  } catch (err) {
    res.status(500).json({ message: `S3 Upload Error: ${err.message}` });
  }
};

// Delete object from S3
exports.deleteObject = async (req, res) => {
  try {
    const { key } = req.body;
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    res.json({ success: true, message: `Deleted: ${key}` });
  } catch (err) {
    res.status(500).json({ message: `S3 Error: ${err.message}` });
  }
};

// Generate a pre-signed download URL
exports.getSignedUrl = async (req, res) => {
  try {
    const { key } = req.params;
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET, Key: decodeURIComponent(key) }),
      { expiresIn: 3600 }
    );
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ message: `S3 Error: ${err.message}` });
  }
};
