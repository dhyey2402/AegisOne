import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Activity, Shield, FileText, CreditCard, ChevronLeft, AlertTriangle } from 'lucide-react';

const CustomerProfile = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/customers/${id}/profile`);
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-muted rounded md:col-span-1"></div>
          <div className="h-64 bg-muted rounded md:col-span-2"></div>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-6 text-center text-muted-foreground">Customer not found</div>;

  const { customer, health_score, timeline, policies, claims, premiums, documents } = data;

  const getScoreColor = (status) => {
    if (status === 'Green') return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    if (status === 'Yellow') return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/customers" className="p-2 hover:bg-muted rounded-full transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{customer.first_name} {customer.last_name}</h1>
          <p className="text-sm text-muted-foreground">{customer.email} | {customer.phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Health Score & Details */}
        <div className="space-y-6">
          {/* Health Score Card */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-gray-900/50">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-primary" />
              Health Score
            </h2>
            <div className="flex items-center justify-between">
              <span className={`text-5xl font-black ${getScoreColor(health_score.status).split(' ')[0]}`}>
                {health_score.score}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(health_score.status)}`}>
                {health_score.status}
              </span>
            </div>
            
            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Score Factors</p>
              {health_score.reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  {reason.includes('-') ? <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" /> : <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shrink-0" />}
                  <span className="text-foreground">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Personal Info</h2>
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">DOB:</span> <span className="float-right font-medium">{customer.dob}</span></div>
              <div><span className="text-muted-foreground">Gov ID:</span> <span className="float-right font-medium">{customer.government_id}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className="float-right font-medium">{customer.status}</span></div>
              <div className="pt-2"><span className="text-muted-foreground block mb-1">Address:</span> <p className="font-medium bg-muted p-2 rounded">{customer.address}</p></div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Tabs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center">
              <Shield className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{policies.length}</div>
              <div className="text-xs text-muted-foreground uppercase">Policies</div>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{claims.length}</div>
              <div className="text-xs text-muted-foreground uppercase">Claims</div>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center">
              <CreditCard className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{premiums.length}</div>
              <div className="text-xs text-muted-foreground uppercase">Payments</div>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm text-center">
              <FileText className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{documents.length}</div>
              <div className="text-xs text-muted-foreground uppercase">Documents</div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-6">Activity Timeline</h2>
            <div className="relative border-l-2 border-muted ml-3 space-y-6 pb-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground pl-4">No activity recorded yet.</p>
              ) : (
                timeline.map((act) => (
                  <div key={act.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-card bg-primary"></div>
                    <div className="text-sm font-semibold">{act.activity_type.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-muted-foreground mt-1">{act.description}</div>
                    <div className="text-xs text-muted-foreground mt-2">{new Date(act.created_at).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </motion.div>
  );
};

export default CustomerProfile;
