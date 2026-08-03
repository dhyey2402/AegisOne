import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Activity, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  PlusCircle,
  FileCheck,
  TrendingUp,
  Wallet,
  Calendar,
  ChevronRight
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [riskCenter, setRiskCenter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        if (user.role === 'CUSTOMER') return;
        const res = await api.get('/reports/dashboard-summary');
        setData(res.data.data.dashboard);
        setRiskCenter(res.data.data.risk_center);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  const lineChartData = useMemo(() => {
    if (!data?.charts) return null;
    return {
      labels: data.charts.revenue.labels,
      datasets: [
        {
          label: 'Collected Premium (₹)',
          data: data.charts.revenue.data,
          borderColor: '#10B981', // primary emerald
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
            return gradient;
          },
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#FFFFFF',
          pointBorderColor: '#10B981',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [data?.charts]);
  
  const lineChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181B',
        titleFont: { size: 13, family: 'Inter' },
        bodyFont: { size: 14, family: 'Inter', weight: 'bold' },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.04)',
          drawBorder: false,
        },
        border: { display: false },
        ticks: { color: '#71717A', font: { family: 'Inter' } }
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#71717A', font: { family: 'Inter' } }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  }), []);

  const donutChartData = useMemo(() => {
    if (!data?.charts) return null;
    return {
      labels: data.charts.policy_types.labels.length > 0 ? data.charts.policy_types.labels : ['No Data'],
      datasets: [
        {
          data: data.charts.policy_types.data.length > 0 ? data.charts.policy_types.data : [1],
          backgroundColor: [
            '#10B981', // Emerald
            '#3B82F6', // Blue
            '#F59E0B', // Amber
            '#6366F1', // Indigo
            '#EC4899', // Pink
          ],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };
  }, [data?.charts]);

  if (user?.role === 'CUSTOMER') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {user.email}!</h1>
        <p className="mt-2 text-muted-foreground text-lg">Navigate to Policies or Claims using the sidebar to manage your account.</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="p-8 h-full flex flex-col gap-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-3 w-1/4">
            <div className="h-10 bg-muted/80 rounded-xl w-3/4"></div>
            <div className="h-4 bg-muted/60 rounded-md w-1/2"></div>
          </div>
          <div className="h-12 bg-muted/80 rounded-xl w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted/50 rounded-2xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-muted/50 rounded-2xl"></div>
          <div className="h-80 bg-muted/50 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const { cards, recent_activities } = data;
  const pendingClaims = cards.total_claims - cards.approved_claims - cards.rejected_claims;
  const settlementRatio = cards.total_claims > 0 ? Math.round((cards.approved_claims / cards.total_claims) * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-8 max-w-[1600px] mx-auto space-y-8"
    >
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-primary mb-1 uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Welcome back, {user.email.split('@')[0]}</h1>
          <p className="text-muted-foreground mt-2">Here's what's happening with your platform today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/policies')} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-card border border-border/60 hover:border-border text-sm font-medium rounded-xl shadow-sm hover:shadow transition-all">
            <PlusCircle className="h-4 w-4 text-muted-foreground" />
            New Policy
          </button>
          <button onClick={() => navigate('/customers')} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-card border border-border/60 hover:border-border text-sm font-medium rounded-xl shadow-sm hover:shadow transition-all">
            <Users className="h-4 w-4 text-muted-foreground" />
            Add Customer
          </button>
          <button onClick={() => navigate('/claims')} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-xl shadow-[0_4px_14px_0_rgb(16,185,129,0.39)] transition-all">
            <FileCheck className="h-4 w-4" />
            File Claim
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Policies', value: cards.total_policies, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Total Customers', value: cards.total_customers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Collected Premium', value: `₹${cards.collected_premium.toLocaleString()}`, icon: Wallet, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
          { label: 'Outstanding Premium', value: `₹${cards.pending_premium.toLocaleString()}`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="bg-white dark:bg-card p-6 rounded-2xl border border-border/40 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:border-border/80 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-card p-6 rounded-2xl border border-border/40 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground">Premium collected over last 6 months</p>
            </div>
            <div className="px-3 py-1 bg-muted/50 rounded-lg text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Last 6 Months
            </div>
          </div>
          <div className="h-72 w-full">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>
        
        {/* Secondary Stats & Donut */}
        <div className="bg-white dark:bg-card p-6 rounded-2xl border border-border/40 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col">
          <h3 className="text-lg font-semibold text-foreground mb-1">Policy Distribution</h3>
          <p className="text-sm text-muted-foreground mb-6">Breakdown by policy type</p>
          
          <div className="flex-1 flex items-center justify-center relative min-h-[220px]">
            <Doughnut 
              data={donutChartData} 
              options={{ 
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                  legend: { display: false },
                  tooltip: { backgroundColor: '#18181B', padding: 12, cornerRadius: 8 }
                }
              }} 
            />
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-foreground">{cards.total_policies}</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Total</span>
            </div>
          </div>
          
          {/* Custom Legend */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {donutChartData?.labels.map((label, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: donutChartData.datasets[0].backgroundColor[idx % donutChartData.datasets[0].backgroundColor.length] }}
                />
                <span className="text-muted-foreground truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Claims & Risk Center Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Claims Overview */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-card p-6 rounded-2xl border border-border/40 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden">
             <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Settlement Ratio</h3>
                <p className="text-sm text-muted-foreground mt-1">Approved vs Total Claims</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-xl">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold text-foreground">{settlementRatio}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 mt-4 overflow-hidden">
              <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${settlementRatio}%` }}></div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-card p-6 rounded-2xl border border-border/40 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
              <button className="text-sm text-primary hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {recent_activities.length > 0 ? (
                recent_activities.map((act, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="p-2 bg-muted/50 text-muted-foreground rounded-lg mt-0.5">
                      {act.type === 'CUSTOMER_REGISTERED' ? <Users className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm text-foreground font-medium">{act.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(act.date).toLocaleDateString()} at {new Date(act.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground text-sm py-4">No recent activity.</div>
              )}
            </div>
          </div>
        </div>

        {/* Risk Center */}
        <div className="lg:col-span-2 bg-white dark:bg-card rounded-2xl border border-border/40 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-muted/20">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Action Center
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Items requiring your attention</p>
            </div>
            {riskCenter?.overdue_premiums?.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                {riskCenter.overdue_premiums.length} Overdue
              </div>
            )}
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            
            {/* Expiring Policies */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-foreground">Expiring Soon (30d)</h4>
                <span className="text-xs font-medium text-muted-foreground">{riskCenter?.expiring_policies?.length || 0} Policies</span>
              </div>
              <div className="space-y-3">
                {riskCenter?.expiring_policies?.length === 0 ? <p className="text-sm text-muted-foreground">No policies expiring soon.</p> : null}
                {riskCenter?.expiring_policies?.map(p => (
                  <div key={p.id} className="group flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/60 border border-border/50 rounded-xl transition-colors cursor-pointer">
                    <div>
                      <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{p.policy_number}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{p.customer_name}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded-md font-medium inline-block mb-1 ${p.priority === 'High' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                        {new Date(p.end_date).toLocaleDateString()}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overdue Premiums */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-foreground">Overdue Premiums</h4>
                <span className="text-xs font-medium text-muted-foreground">{riskCenter?.overdue_premiums?.length || 0} Payments</span>
              </div>
              <div className="space-y-3">
                {riskCenter?.overdue_premiums?.length === 0 ? <p className="text-sm text-muted-foreground">No overdue premiums.</p> : null}
                {riskCenter?.overdue_premiums?.map(p => (
                  <div key={p.id} className="group flex items-center justify-between p-3 bg-red-50/50 hover:bg-red-50 dark:bg-red-900/10 dark:hover:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl transition-colors cursor-pointer">
                    <div>
                      <div className="text-sm font-semibold text-foreground group-hover:text-red-600 transition-colors">{p.policy_number}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{p.customer_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600 dark:text-red-400">₹{p.amount.toLocaleString()}</div>
                      <div className="text-[10px] uppercase font-bold text-red-500 mt-0.5 tracking-wider">Due: {new Date(p.due_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
    </motion.div>
  );
};

export default Dashboard;
