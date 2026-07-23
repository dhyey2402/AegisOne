import { useState, useEffect } from 'react';
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
  XCircle
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        if (user.role === 'CUSTOMER') return; // Customers have a different view
        const res = await api.get('/reports/dashboard');
        setData(res.data.data);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  if (user?.role === 'CUSTOMER') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {user.email}!</h1>
        <p className="mt-2 text-muted-foreground">Navigate to Policies or Claims using the sidebar to manage your account.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const { cards, charts, recent_activities } = data;

  const lineChartData = {
    labels: charts.revenue.labels,
    datasets: [
      {
        label: 'Collected Premium ($)',
        data: charts.revenue.data,
        borderColor: 'hsl(221.2 83.2% 53.3%)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
    ],
  };
  
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const donutChartData = {
    labels: charts.policy_types.labels.length > 0 ? charts.policy_types.labels : ['No Data'],
    datasets: [
      {
        label: 'Policies',
        data: charts.policy_types.data.length > 0 ? charts.policy_types.data : [1],
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

  return (
    <div className="p-6 space-y-6">
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
              <h3 className="text-2xl font-bold text-foreground mt-2">${cards.collected_premium.toLocaleString()}</h3>
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
        
        {/* Claims Summary */}
        <div className="bg-white dark:bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Claims Overview</h3>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Total Claims</span>
              </div>
              <span className="font-bold">{cards.total_claims}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900 dark:text-green-400">Approved</span>
              </div>
              <span className="font-bold text-green-700 dark:text-green-500">{cards.approved_claims}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-900 dark:text-red-400">Rejected</span>
              </div>
              <span className="font-bold text-red-700 dark:text-red-500">{cards.rejected_claims}</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
