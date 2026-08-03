import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, Plus, FileText, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { motion } from 'framer-motion';

const policySchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  policy_type: z.string().min(1, 'Type is required'),
  coverage_amount: z.number().min(1, 'Amount is required'),
  premium_amount: z.number().min(1, 'Premium is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
});

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(policySchema)
  });

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/policies?search=${search}`);
      setPolicies(res.data.data.items);
    } catch (error) {
      toast.error('Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers?limit=100');
      setCustomers(res.data.data.items);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPolicies();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/policies', data);
      toast.success('Policy created successfully');
      setIsModalOpen(false);
      reset();
      fetchPolicies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleRenew = async (id) => {
    try {
      await api.put(`/policies/${id}/renew`, {}, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      toast.success('Policy renewed successfully');
      fetchPolicies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to renew policy');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/policies/${id}/status`, { status });
      toast.success(`Policy marked as ${status}`);
      fetchPolicies();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading && policies.length === 0) {
    return (
      <div className="p-6 h-full flex flex-col gap-6 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-10 bg-muted rounded w-32"></div>
        </div>
        <div className="h-[400px] bg-muted rounded-xl"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Policies</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage active and past insurance policies</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search policies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary w-64"
            />
          </div>
          <button
            onClick={() => { reset(); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Create Policy
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-3 font-medium">Policy ID</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Coverage</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : policies.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">No policies found.</td></tr>
              ) : (
                policies.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> {p.policy_number}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {p.customer_name}
                    </td>
                    <td className="px-6 py-4">
                      {p.policy_type}
                    </td>
                    <td className="px-6 py-4">
                      ₹{p.coverage_amount.toLocaleString()}
                      <div className="text-xs text-muted-foreground">Prem: ₹{p.premium_amount}/yr</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : p.status === 'EXPIRED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      {p.status === 'EXPIRED' || p.status === 'CANCELLED' ? (
                        <button onClick={() => handleRenew(p.id)} className="text-primary hover:underline text-xs font-medium">
                          Renew
                        </button>
                      ) : null}
                      {p.status === 'ACTIVE' ? (
                        <button onClick={() => handleStatusChange(p.id, 'SUSPENDED')} className="text-orange-500 hover:underline text-xs font-medium">
                          Suspend
                        </button>
                      ) : null}
                      {p.status === 'SUSPENDED' ? (
                        <button onClick={() => handleStatusChange(p.id, 'ACTIVE')} className="text-green-500 hover:underline text-xs font-medium">
                          Activate
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-card w-full max-w-lg rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold">Create New Policy</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="policyForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Customer</label>
                  <select {...register('customer_id')} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none">
                    <option value="">Select Customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                    ))}
                  </select>
                  {errors.customer_id && <p className="text-destructive text-xs mt-1">{errors.customer_id.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Policy Type</label>
                  <select {...register('policy_type')} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none">
                    <option value="">Select Type...</option>
                    <option value="LIFE">Life Insurance</option>
                    <option value="HEALTH">Health Insurance</option>
                    <option value="AUTO">Auto Insurance</option>
                    <option value="HOME">Home Insurance</option>
                    <option value="PROPERTY">Property Insurance</option>
                  </select>
                  {errors.policy_type && <p className="text-destructive text-xs mt-1">{errors.policy_type.message}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Coverage Amount (₹)</label>
                    <input type="number" step="0.01" {...register('coverage_amount', { valueAsNumber: true })} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none" />
                    {errors.coverage_amount && <p className="text-destructive text-xs mt-1">{errors.coverage_amount.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Premium Amount (₹)</label>
                    <input type="number" step="0.01" {...register('premium_amount', { valueAsNumber: true })} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none" />
                    {errors.premium_amount && <p className="text-destructive text-xs mt-1">{errors.premium_amount.message}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input type="date" {...register('start_date')} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none" />
                    {errors.start_date && <p className="text-destructive text-xs mt-1">{errors.start_date.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input type="date" {...register('end_date')} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none" />
                    {errors.end_date && <p className="text-destructive text-xs mt-1">{errors.end_date.message}</p>}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" form="policyForm" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">Create Policy</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Policies;
