/**
 * config/aws.js — AWS SDK client initialization (EC2 + S3)
 */

const { EC2Client } = require('@aws-sdk/client-ec2');
const { S3Client }  = require('@aws-sdk/client-s3');

const awsConfig = {
  region:      process.env.AWS_REGION      || 'us-east-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const ec2Client = new EC2Client(awsConfig);
const s3Client  = new S3Client(awsConfig);

module.exports = { ec2Client, s3Client };
