/**
 * pages/Cloud.jsx — AWS EC2 & S3 management dashboard
 */

import React, { useEffect, useState } from 'react';
import { Cloud as CloudIcon, Server, HardDrive, Play, Square, Upload, Trash2, Download, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { cloudService } from '../services/cloud';

const instanceStateColor = {
  running:   'bg-green-100 text-green-700',
  stopped:   'bg-red-100 text-red-700',
  stopping:  'bg-yellow-100 text-yellow-700',
  starting:  'bg-blue-100 text-blue-700',
  pending:   'bg-blue-100 text-blue-700',
  terminated:'bg-gray-100 text-gray-500',
};

export default function Cloud() {
  const [instances,  setInstances]  = useState([]);
  const [objects,    setObjects]    = useState([]);
  const [buckets,    setBuckets]    = useState([]);
  const [loading,    setLoading]    = useState({ ec2: true, s3: true });
  const [actionId,   setActionId]   = useState(null);
  const [file,       setFile]       = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [activeTab,  setActiveTab]  = useState('ec2');

  const fetchEC2 = async () => {
    setLoading(l => ({ ...l, ec2: true }));
    try {
      const res = await cloudService.listInstances();
      setInstances(res.data.instances);
    } catch (err) {
      toast.error('EC2: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(l => ({ ...l, ec2: false }));
    }
  };

  const fetchS3 = async () => {
    setLoading(l => ({ ...l, s3: true }));
    try {
      const [obj, bkt] = await Promise.all([cloudService.listObjects(), cloudService.listBuckets()]);
      setObjects(obj.data.objects);
      setBuckets(bkt.data.buckets);
    } catch (err) {
      toast.error('S3: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(l => ({ ...l, s3: false }));
    }
  };

  useEffect(() => { fetchEC2(); fetchS3(); }, []);

  const handleInstanceAction = async (id, action) => {
    setActionId(id);
    try {
      const fn = action === 'start' ? cloudService.startInstance : cloudService.stopInstance;
      const res = await fn(id);
      toast.success(`Instance ${res.data.state}`);
      setTimeout(fetchEC2, 2000); // slight delay for AWS to update
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const handleS3Upload = async () => {
    if (!file) { toast.error('Please select a file'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await cloudService.uploadFile(fd);
      toast.success('Uploaded to S3 ✅');
      setFile(null);
      fetchS3();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (key) => {
    if (!confirm(`Delete ${key}?`)) return;
    try {
      await cloudService.deleteObject(key);
      toast.success('Deleted');
      fetchS3();
    } catch { toast.error('Delete failed'); }
  };

  const handleDownload = async (key) => {
    try {
      const res = await cloudService.getSignedUrl(key);
      window.open(res.data.url, '_blank');
    } catch { toast.error('Failed to get download link'); }
  };

  const tabs = [
    { id: 'ec2', label: 'EC2 Instances', icon: Server },
    { id: 's3',  label: 'S3 Storage',    icon: HardDrive },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <CloudIcon size={20} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cloud Management</h1>
          <p className="text-gray-500 text-sm">AWS EC2 instances & S3 storage</p>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{instances.length}</p>
          <p className="text-sm text-gray-500 mt-1">EC2 Instances</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{instances.filter(i => i.state === 'running').length}</p>
          <p className="text-sm text-gray-500 mt-1">Running</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{objects.length}</p>
          <p className="text-sm text-gray-500 mt-1">S3 Objects</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ═══ EC2 Tab ═══ */}
      {activeTab === 'ec2' && (
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">EC2 Instances</h2>
            <button onClick={fetchEC2} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            {loading.ec2 ? (
              <div className="p-8 text-center text-gray-400">Loading instances...</div>
            ) : instances.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No EC2 instances found</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    {['Name','Instance ID','Type','State','Public IP','AZ','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {instances.map((inst) => (
                    <tr key={inst.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{inst.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{inst.id}</td>
                      <td className="px-4 py-3 text-gray-600">{inst.type}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${instanceStateColor[inst.state] || 'bg-gray-100 text-gray-500'}`}>
                          {inst.state}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{inst.publicIp}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{inst.az}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {inst.state === 'stopped' && (
                            <button
                              onClick={() => handleInstanceAction(inst.id, 'start')}
                              disabled={actionId === inst.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              <Play size={11} /> Start
                            </button>
                          )}
                          {inst.state === 'running' && (
                            <button
                              onClick={() => handleInstanceAction(inst.id, 'stop')}
                              disabled={actionId === inst.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              <Square size={11} /> Stop
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ═══ S3 Tab ═══ */}
      {activeTab === 's3' && (
        <div className="space-y-4">
          {/* Upload */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Upload to S3</h2>
            <div className="flex gap-3">
              <div
                className="flex-1 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => document.getElementById('s3-file').click()}
              >
                <p className="text-sm text-gray-500">{file ? file.name : 'Click to select file'}</p>
                <input id="s3-file" type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
              </div>
              <button onClick={handleS3Upload} disabled={uploading || !file} className="btn-primary flex items-center gap-2 whitespace-nowrap">
                <Upload size={15} /> {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>

          {/* Objects table */}
          <div className="card overflow-hidden p-0">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">S3 Objects ({buckets[0]?.Name || '—'})</h2>
              <button onClick={fetchS3} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              {loading.s3 ? (
                <div className="p-8 text-center text-gray-400">Loading S3 objects...</div>
              ) : objects.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No objects in bucket</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      {['Key','Size','Last Modified','Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {objects.map((obj) => (
                      <tr key={obj.Key} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 max-w-xs truncate">{obj.Key}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{(obj.Size / 1024).toFixed(1)} KB</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(obj.LastModified).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownload(obj.Key)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(obj.Key)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
