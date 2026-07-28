import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CreditCard, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';

const paymentSchema = z.object({
  amount: z.number().min(1, 'Amount is required'),
});

const Premiums = () => {
  const [payments, setPayments] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(paymentSchema)
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/premiums?status=${statusFilter}`);
      setPayments(res.data.data.items);
    } catch (error) {
      toast.error('Failed to fetch premium payments');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPolicies = async () => {
    try {
      const res = await api.get('/policies?limit=100&status=ACTIVE');
      setPolicies(res.data.data.items);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handlePrintReceipt = (payment) => {
    window.open(`/receipt/${payment.id}`, '_blank');
  };

  const [selectedPremium, setSelectedPremium] = useState(null);

  const openPaymentModal = (premium) => {
    setSelectedPremium(premium);
    reset({ amount: premium.amount });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    if (!selectedPremium) return;
    try {
      await api.put(`/premiums/${selectedPremium.id}/pay`, data);
      toast.success('Payment recorded successfully');
      setIsModalOpen(false);
      reset();
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className="p-6 h-full flex flex-col gap-6 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-10 bg-muted rounded w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl"></div>)}
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
          <h1 className="text-2xl font-bold text-foreground">Premium Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and record policy premiums</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><CheckCircle className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Collected Premium</p>
            <p className="text-2xl font-bold mt-1">₹{payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><Clock className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Pending Premium</p>
            <p className="text-2xl font-bold mt-1">₹{payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><CreditCard className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Transactions</p>
            <p className="text-2xl font-bold mt-1">{payments.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-3 font-medium">Policy ID</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Due Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">No payments found.</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {p.policy_number}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {p.customer_name}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      ₹{p.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {p.due_date}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.status === 'PAID' ? 'bg-green-100 text-green-800' : p.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {p.status !== 'PAID' ? (
                        <button onClick={() => openPaymentModal(p)} className="text-primary hover:underline font-medium">
                          Pay Now
                        </button>
                      ) : (
                        <button onClick={() => handlePrintReceipt(p)} className="text-primary hover:underline font-medium">
                          Print Receipt
                        </button>
                      )}
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
          <div className="bg-white dark:bg-card w-full max-w-md rounded-lg shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold">Record Payment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            
            <div className="p-6">
              <form id="paymentForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Paying for Policy: {selectedPremium?.policy_number}</label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Amount (₹)</label>
                  <input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none" />
                  {errors.amount && <p className="text-destructive text-xs mt-1">{errors.amount.message}</p>}
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" form="paymentForm" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">Submit Payment</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Premiums;
