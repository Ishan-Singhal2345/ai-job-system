/**
 * services/cloud.js — EC2 & S3 API calls
 */

import api from './api';

export const cloudService = {
  // EC2
  listInstances:  ()     => api.get('/cloud/ec2/instances'),
  startInstance:  (id)   => api.post(`/cloud/ec2/${id}/start`),
  stopInstance:   (id)   => api.post(`/cloud/ec2/${id}/stop`),

  // S3
  listBuckets:    ()     => api.get('/cloud/s3/buckets'),
  listObjects:    (prefix = '') => api.get(`/cloud/s3/objects?prefix=${prefix}`),
  uploadFile:     (formData) =>
    api.post('/cloud/s3/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteObject:   (key)  => api.delete('/cloud/s3/object', { data: { key } }),
  getSignedUrl:   (key)  => api.get(`/cloud/s3/signed/${encodeURIComponent(key)}`),
};
