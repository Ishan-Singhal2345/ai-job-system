/**
 * pages/Dashboard.jsx — Analytics dashboard with Chart.js graphs
 */

import React, { useEffect, useState } from 'react';
import { Briefcase, Users, TrendingUp, CheckCircle } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../services/api';
import StatsCard from '../components/StatsCard';
import { useAuth } from '../context/AuthContext';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend
);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const { user } = useAuth();
  const [jobStats,  setJobStats]  = useState(null);
  const [candStats, setCandStats] = useState(null);

  useEffect(() => {
    api.get('/jobs/stats').then(r => setJobStats(r.data)).catch(console.error);
    api.get('/candidates/stats').then(r => setCandStats(r.data)).catch(console.error);
  }, []);

  // Build monthly chart labels & data
  const monthlyLabels = jobStats?.monthly?.map(m => MONTHS[m._id.month - 1]) || [];
  const monthlyData   = jobStats?.monthly?.map(m => m.count) || [];

  // Candidate status doughnut
  const statusMap = {};
  candStats?.stats?.byStatus?.forEach(s => { statusMap[s._id] = s.count; });
  const candLabels = Object.keys(statusMap);
  const candValues = Object.values(statusMap);

  const cardData = [
    { title: 'Total Jobs',        value: jobStats?.stats?.total,     icon: Briefcase,   color: 'blue'   },
    { title: 'Active Jobs',       value: jobStats?.stats?.active,    icon: TrendingUp,  color: 'green'  },
    { title: 'Total Candidates',  value: candStats?.stats?.total,    icon: Users,       color: 'purple' },
    { title: 'Avg Match Score',   value: candStats?.stats?.avgMatchScore ? `${candStats.stats.avgMatchScore}%` : '—', icon: CheckCircle, color: 'yellow' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name} 👋</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardData.map((c) => <StatsCard key={c.title} {...c} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly job postings bar chart */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Monthly Job Postings</h2>
          <Bar
            data={{
              labels: monthlyLabels.length ? monthlyLabels : ['No data'],
              datasets: [{
                label: 'Jobs Posted',
                data: monthlyData.length ? monthlyData : [0],
                backgroundColor: 'rgba(59,130,246,0.7)',
                borderRadius: 6,
              }],
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>

        {/* Candidate status doughnut */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Candidate Pipeline</h2>
          {candLabels.length > 0 ? (
            <Doughnut
              data={{
                labels: candLabels,
                datasets: [{
                  data: candValues,
                  backgroundColor: [
                    '#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#6366f1',
                  ],
                  borderWidth: 2,
                }],
              }}
              options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No candidates yet</div>
          )}
        </div>
      </div>

      {/* Job status breakdown */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Job Status Breakdown</h2>
        <div className="grid grid-cols-3 gap-4">
          {['active','draft','closed'].map(s => (
            <div key={s} className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-3xl font-bold text-gray-900">{jobStats?.stats?.[s] || 0}</p>
              <p className="text-sm text-gray-500 capitalize mt-1">{s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
