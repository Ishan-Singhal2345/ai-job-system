/**
 * pages/JobDetail.jsx — Single job view with candidate list and rankings
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Briefcase, Star, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';

const scoreColor = (s) => {
  if (s >= 75) return 'text-green-600 bg-green-50';
  if (s >= 50) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

const statusColors = {
  applied:   'bg-blue-100 text-blue-700',
  screening: 'bg-purple-100 text-purple-700',
  interview: 'bg-yellow-100 text-yellow-700',
  offer:     'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  hired:     'bg-emerald-100 text-emerald-700',
};

export default function JobDetail() {
  const { id } = useParams();
  const [job,        setJob]        = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/jobs/${id}`),
      api.get(`/candidates?jobId=${id}`),
    ]).then(([j, c]) => {
      setJob(j.data.job);
      setCandidates(c.data.candidates);
    }).catch(() => toast.error('Failed to load job details'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (candidateId, status) => {
    try {
      await api.put(`/candidates/${candidateId}`, { status });
      setCandidates(prev => prev.map(c => c._id === candidateId ? { ...c, status } : c));
      toast.success('Status updated');
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-48 bg-gray-200 rounded" /></div>;
  if (!job) return <div className="text-center py-20 text-gray-400">Job not found</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link to="/jobs" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back to Jobs
      </Link>

      {/* Job header */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              {job.department && <span>{job.department}</span>}
              {job.location   && <span className="flex items-center gap-1"><MapPin size={14}/>{job.location}</span>}
              <span className="flex items-center gap-1"><Clock size={14}/>{job.type}</span>
              <span className="flex items-center gap-1"><Briefcase size={14}/>{job.applicantsCount} applicants</span>
            </div>
          </div>
          <span className={`badge ${job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {job.status}
          </span>
        </div>

        {/* Salary */}
        {(job.salary?.min || job.salary?.max) && (
          <p className="mt-3 text-sm font-medium text-gray-700">
            💰 {job.salary.currency} {job.salary.min?.toLocaleString()} – {job.salary.max?.toLocaleString()}
          </p>
        )}

        {/* Skills */}
        {job.skills?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.skills.map(s => (
              <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{s}</span>
            ))}
          </div>
        )}

        {/* AI-generated description */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Star size={14} className="text-yellow-400" /> AI-Generated Description
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
        </div>
      </div>

      {/* Candidate ranking */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Users size={18} /> Candidate Rankings
          </h2>
          <span className="text-sm text-gray-400">{candidates.length} candidates</span>
        </div>

        {candidates.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No candidates yet for this job</div>
        ) : (
          <div className="space-y-3">
            {candidates.map((c, i) => (
              <div key={c._id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                {/* Rank */}
                <div className="w-6 text-center text-sm font-bold text-gray-400">#{i + 1}</div>

                {/* Avatar */}
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {c.name[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 truncate">{c.email}</p>
                  {c.matchSummary && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{c.matchSummary}</p>
                  )}
                </div>

                {/* Match score */}
                <div className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-bold ${scoreColor(c.matchScore)}`}>
                  {c.matchScore}%
                </div>

                {/* Status select */}
                <select
                  value={c.status}
                  onChange={e => updateStatus(c._id, e.target.value)}
                  className={`text-xs border-0 rounded-lg px-2 py-1 font-medium cursor-pointer focus:ring-2 focus:ring-blue-500 ${statusColors[c.status]}`}
                >
                  {['applied','screening','interview','offer','rejected','hired'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
