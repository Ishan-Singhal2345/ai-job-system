/**
 * pages/Candidates.jsx — Candidate management with AI resume upload
 */

import React, { useEffect, useState } from 'react';
import { Upload, Search, Users, Sparkles, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const scoreColor = (s) => {
  if (s >= 75) return 'bg-green-100 text-green-700';
  if (s >= 50) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

export default function Candidates() {
  const { isAdmin, isHR } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [jobs,       setJobs]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [uploading,  setUploading]  = useState(false);

  const [form, setForm] = useState({ jobId:'', name:'', email:'', phone:'', notes:'' });
  const [file, setFile] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, j] = await Promise.all([api.get('/candidates'), api.get('/jobs?limit=100')]);
      setCandidates(c.data.candidates);
      setTotal(c.data.total);
      setJobs(j.data.jobs);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jobId) { toast.error('Please select a job'); return; }
    setUploading(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('resume', file);

    try {
      await api.post('/candidates', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Candidate added — AI parsing complete ✨');
      setShowModal(false);
      setForm({ jobId:'', name:'', email:'', phone:'', notes:'' });
      setFile(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add candidate');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this candidate?')) return;
    try {
      await api.delete(`/candidates/${id}`);
      toast.success('Deleted');
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const filtered = candidates.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-500 text-sm">{total} total applicants</p>
        </div>
        {(isAdmin || isHR) && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Upload size={16} /> Add Candidate
          </button>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Candidate','Job','Match Score','Skills','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    No candidates found
                  </td>
                </tr>
              ) : filtered.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                        {c.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.job?.title || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${scoreColor(c.matchScore)}`}>{c.matchScore}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.parsedResume?.skills?.slice(0,3).map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-blue-100 text-blue-700">{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {(isAdmin || isHR) && (
                      <button onClick={() => handleDelete(c._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-blue-500" />
                <h2 className="text-lg font-bold">Add Candidate + AI Resume Parse</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">Upload resume PDF — AI will parse and score automatically.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Position</label>
                <select className="input" value={form.jobId} onChange={e => setForm({ ...form, jobId: e.target.value })} required>
                  <option value="">Select a job...</option>
                  {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
                </select>
              </div>

              {[
                { label:'Full Name', key:'name', type:'text', placeholder:'Jane Doe', required: true },
                { label:'Email',     key:'email', type:'email', placeholder:'jane@email.com', required: true },
                { label:'Phone',     key:'phone', type:'tel', placeholder:'+1 555 000 0000', required: false },
              ].map(({ label, key, type, placeholder, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} className="input" placeholder={placeholder} required={required}
                    value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resume PDF <span className="text-blue-500 text-xs">(AI parsed + matched)</span>
                </label>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  onClick={() => document.getElementById('resume-input').click()}
                >
                  <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">{file ? file.name : 'Click to upload PDF / DOC'}</p>
                  <input
                    id="resume-input" type="file" className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={e => setFile(e.target.files[0])}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea className="input h-20 resize-none" placeholder="Internal notes..."
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={uploading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Sparkles size={15} />
                  {uploading ? 'AI processing...' : 'Add & Parse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
