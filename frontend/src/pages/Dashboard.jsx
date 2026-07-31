import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  FileText, 
  Activity, 
  DollarSign, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertTriangle
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
  ArcElement
);

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [riskCenter, setRiskCenter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        if (user.role === 'CUSTOMER') return; // Customers have a different view
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
          borderColor: 'hsl(221.2 83.2% 53.3%)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.4,
        },
      ],
    };
  }, [data?.charts]);
  
  const lineChartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true }
    }
  }), []);

  const donutChartData = useMemo(() => {
    if (!data?.charts) return null;
    return {
      labels: data.charts.policy_types.labels.length > 0 ? data.charts.policy_types.labels : ['No Data'],
      datasets: [
        {
          label: 'Policies',
          data: data.charts.policy_types.data.length > 0 ? data.charts.policy_types.data : [1],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [data?.charts]);

  if (user?.role === 'CUSTOMER') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {user.email}!</h1>
        <p className="mt-2 text-muted-foreground">Navigate to Policies or Claims using the sidebar to manage your account.</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="p-6 h-full flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-muted rounded-xl"></div>
          <div className="h-72 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  const { cards, charts, recent_activities } = data;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform analytics and key metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
              <h3 className="text-2xl font-bold text-foreground mt-2">{cards.total_customers}</h3>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users className="h-5 w-5" /></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Policies</p>
              <h3 className="text-2xl font-bold text-foreground mt-2">{cards.total_policies}</h3>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><FileText className="h-5 w-5" /></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Collected Premium</p>
              <h3 className="text-2xl font-bold text-foreground mt-2">₹{cards.collected_premium.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-lg"><DollarSign className="h-5 w-5" /></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-card p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Claims</p>
              <h3 className="text-2xl font-bold text-foreground mt-2">{cards.total_claims - cards.approved_claims - cards.rejected_claims}</h3>
            </div>
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><Clock className="h-5 w-5" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Trend (Last 6 Months)</h3>
          <div className="h-72 flex items-center justify-center">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>
        
        {/* Donut Chart */}
        <div className="bg-white dark:bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-foreground mb-4">Policies by Type</h3>
          <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
            <Doughnut data={donutChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="divide-y divide-border">
            {recent_activities.length > 0 ? (
              recent_activities.map((act, i) => (
                <div key={i} className="p-6 flex items-start gap-4">
                  <div className="p-2 bg-primary/10 text-primary rounded-full">
                    {act.type === 'CUSTOMER_REGISTERED' ? <Users className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">{act.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(act.date).toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-muted-foreground text-sm">No recent activity.</div>
            )}
          </div>
        </div>

        {/* Smart Renewal & Risk Center */}
        <div className="lg:col-span-3 bg-white dark:bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Smart Renewal & Risk Center
            </h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Needs Attention</span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Expiring Policies */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Expiring Policies (30d)</h4>
              <div className="space-y-3">
                {riskCenter?.expiring_policies?.length === 0 ? <p className="text-sm">No policies expiring soon.</p> : null}
                {riskCenter?.expiring_policies?.map(p => (
                  <div key={p.id} className="p-3 bg-muted/50 rounded-lg border border-border text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold">{p.policy_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${p.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.priority}</span>
                    </div>
                    <div className="text-muted-foreground">{p.customer_name}</div>
                    <div className="text-xs mt-2 text-foreground font-medium">Expires: {new Date(p.end_date).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overdue Premiums */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Overdue Premiums</h4>
              <div className="space-y-3">
                {riskCenter?.overdue_premiums?.length === 0 ? <p className="text-sm">No overdue premiums.</p> : null}
                {riskCenter?.overdue_premiums?.map(p => (
                  <div key={p.id} className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold">{p.policy_number}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-red-200 text-red-800">{p.priority}</span>
                    </div>
                    <div className="text-red-700 dark:text-red-400 font-medium">₹{p.amount.toLocaleString()}</div>
                    <div className="text-xs mt-1 text-muted-foreground">Due: {new Date(p.due_date).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Claims */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Pending Claims</h4>
              <div className="space-y-3">
                {riskCenter?.pending_claims?.length === 0 ? <p className="text-sm">No pending claims.</p> : null}
                {riskCenter?.pending_claims?.map(p => (
                  <div key={p.id} className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold">{p.claim_number}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-200 text-amber-800">{p.priority}</span>
                    </div>
                    <div className="text-amber-700 dark:text-amber-400">{p.customer_name}</div>
                    <div className="text-xs mt-1 text-muted-foreground">Status: {p.status}</div>
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
