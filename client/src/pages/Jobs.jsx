/**
 * pages/Jobs.jsx — Job listing + AI-powered creation modal
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Briefcase, MapPin, Clock, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  active:  'bg-green-100 text-green-700',
  draft:   'bg-gray-100 text-gray-600',
  closed:  'bg-red-100 text-red-700',
};

export default function Jobs() {
  const { isAdmin, isHR } = useAuth();
  const [jobs,    setJobs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [form, setForm] = useState({
    title: '', department: '', location: '', type: 'full-time',
    rawRequirements: '', experience: '',
    salary: { min: '', max: '', currency: 'USD' },
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs?search=${search}`);
      setJobs(res.data.jobs);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setAiLoading(true);
    try {
      await api.post('/jobs', form);
      toast.success('Job created with AI description ✨');
      setShowModal(false);
      setForm({ title:'', department:'', location:'', type:'full-time', rawRequirements:'', experience:'', salary:{min:'',max:'',currency:'USD'} });
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create job');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this job?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      toast.success('Job deleted');
      fetchJobs();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Requirements</h1>
          <p className="text-gray-500 text-sm">{total} total positions</p>
        </div>
        {(isAdmin || isHR) && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Create Job
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search jobs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Job cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div key={job._id} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/jobs/${job._id}`}
                    className="text-base font-semibold text-gray-900 hover:text-blue-600 truncate block"
                  >
                    {job.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-0.5">{job.department}</p>
                </div>
                <span className={`badge ml-2 flex-shrink-0 ${statusColors[job.status]}`}>
                  {job.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                {job.location && (
                  <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
                )}
                <span className="flex items-center gap-1"><Clock size={12} />{job.type}</span>
                <span className="flex items-center gap-1"><Briefcase size={12} />{job.applicantsCount} applicants</span>
              </div>

              {job.skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {job.skills.slice(0, 4).map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{s}</span>
                  ))}
                  {job.skills.length > 4 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{job.skills.length - 4}</span>
                  )}
                </div>
              )}

              {(isAdmin || isHR) && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link to={`/jobs/${job._id}`} className="btn-secondary text-xs py-1 flex-1 text-center">View</Link>
                  <button onClick={() => handleDelete(job._id)} className="btn-danger text-xs py-1 px-3 flex items-center gap-1">
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-blue-500" />
                <h2 className="text-lg font-bold">Create Job with AI</h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">AI will auto-generate a professional job description.</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {[
                { label:'Job Title', key:'title', placeholder:'e.g. Senior React Developer' },
                { label:'Department', key:'department', placeholder:'e.g. Engineering' },
                { label:'Location', key:'location', placeholder:'e.g. Remote / New York' },
                { label:'Experience', key:'experience', placeholder:'e.g. 3-5 years' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    className="input" placeholder={placeholder}
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    required={key === 'title'}
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {['full-time','part-time','contract','remote'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raw Requirements <span className="text-blue-500 text-xs">(AI will expand this)</span>
                </label>
                <textarea
                  className="input h-28 resize-none"
                  placeholder="List key requirements, tech stack, responsibilities..."
                  value={form.rawRequirements}
                  onChange={e => setForm({ ...form, rawRequirements: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
                  <input type="number" className="input" placeholder="50000"
                    value={form.salary.min}
                    onChange={e => setForm({ ...form, salary: { ...form.salary, min: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
                  <input type="number" className="input" placeholder="80000"
                    value={form.salary.max}
                    onChange={e => setForm({ ...form, salary: { ...form.salary, max: e.target.value } })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={aiLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Sparkles size={15} />
                  {aiLoading ? 'AI generating...' : 'Create with AI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
