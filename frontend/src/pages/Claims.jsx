import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Activity, Plus, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';

const claimSchema = z.object({
  policy_id: z.string().min(1, 'Policy is required'),
  claim_amount: z.number().min(1, 'Amount is required'),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().min(1, 'Description is required'),
});

const Claims = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(claimSchema)
  });

  const [reviewNotes, setReviewNotes] = useState('');
  const [settlementAmount, setSettlementAmount] = useState('');

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/claims?status=${statusFilter}`);
      setClaims(res.data.data.items);
    } catch (error) {
      toast.error('Failed to fetch claims');
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
    fetchClaims();
    fetchPolicies();
  }, [statusFilter]);

  const onSubmitClaim = async (data) => {
    try {
      await api.post('/claims', data);
      toast.success('Claim submitted successfully');
      setIsSubmitModalOpen(false);
      reset();
      fetchClaims();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };
  
  const handleReview = async (action) => {
    try {
      await api.put(`/claims/${selectedClaim.id}/review`, {
        action,
        notes: reviewNotes,
        settlement_amount: settlementAmount ? parseFloat(settlementAmount) : undefined
      });
      toast.success(`Claim ${action.toLowerCase()} successfully`);
      setIsReviewModalOpen(false);
      setSelectedClaim(null);
      setReviewNotes('');
      setSettlementAmount('');
      fetchClaims();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Claims Processing</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and review policy claims</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button
            onClick={() => { reset(); setIsSubmitModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Submit Claim
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-3 font-medium">Claim ID</th>
                <th className="px-6 py-3 font-medium">Policy / Customer</th>
                <th className="px-6 py-3 font-medium">Reason</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : claims.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">No claims found.</td></tr>
              ) : (
                claims.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" /> {c.claim_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <div className="text-foreground">{c.policy_number}</div>
                      <div className="text-muted-foreground text-xs font-normal">{c.customer_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      {c.reason}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      ${c.claim_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                        ${c.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                          c.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                          c.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800' : 
                          'bg-amber-100 text-amber-800'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user?.role !== 'CUSTOMER' && c.status !== 'APPROVED' && c.status !== 'REJECTED' && (
                        <button 
                          onClick={() => { setSelectedClaim(c); setIsReviewModalOpen(true); }}
                          className="text-primary hover:text-primary/80 font-medium text-sm"
                        >
                          Review
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

      {/* Submit Claim Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-card w-full max-w-lg rounded-lg shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold">Submit New Claim</h2>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            
            <div className="p-6">
              <form id="claimForm" onSubmit={handleSubmit(onSubmitClaim)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Policy</label>
                  <select {...register('policy_id')} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none">
                    <option value="">Select Policy...</option>
                    {policies.map(p => (
                      <option key={p.id} value={p.id}>{p.policy_number} - {p.customer_name}</option>
                    ))}
                  </select>
                  {errors.policy_id && <p className="text-destructive text-xs mt-1">{errors.policy_id.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Claim Amount ($)</label>
                  <input type="number" step="0.01" {...register('claim_amount', { valueAsNumber: true })} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none" />
                  {errors.claim_amount && <p className="text-destructive text-xs mt-1">{errors.claim_amount.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Reason</label>
                  <input type="text" {...register('reason')} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. Car Accident, Medical Emergency" />
                  {errors.reason && <p className="text-destructive text-xs mt-1">{errors.reason.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea {...register('description')} rows="3" className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none"></textarea>
                  {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
              <button onClick={() => setIsSubmitModalOpen(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" form="claimForm" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">Submit Claim</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Review Claim Modal */}
      {isReviewModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-card w-full max-w-lg rounded-lg shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold">Review Claim: {selectedClaim.claim_number}</h2>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm"><strong>Requested Amount:</strong> ${selectedClaim.claim_amount.toLocaleString()}</p>
                <p className="text-sm mt-1"><strong>Reason:</strong> {selectedClaim.reason}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Verification Notes</label>
                <textarea 
                  value={reviewNotes} 
                  onChange={(e) => setReviewNotes(e.target.value)} 
                  rows="3" 
                  className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Add notes about investigation..."
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Approved Settlement Amount ($) <span className="text-muted-foreground font-normal">(if approving)</span></label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={settlementAmount} 
                  onChange={(e) => setSettlementAmount(e.target.value)} 
                  className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none" 
                  placeholder={selectedClaim.claim_amount}
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-between items-center">
              <button onClick={() => handleReview('UNDER_REVIEW')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Mark Under Review</button>
              <div className="flex gap-3">
                <button onClick={() => handleReview('REJECT')} className="flex items-center gap-1 bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-colors">
                  <XCircle className="h-4 w-4" /> Reject
                </button>
                <button onClick={() => handleReview('APPROVE')} className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                  <CheckCircle className="h-4 w-4" /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Claims;
