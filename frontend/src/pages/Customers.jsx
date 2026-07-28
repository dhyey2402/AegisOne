import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const customerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(1, 'Address is required'),
  government_id: z.string().min(1, 'Government ID is required'),
});

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(customerSchema)
  });

  const [statusFilter, setStatusFilter] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?search=${search}&status=${statusFilter}`);
      setCustomers(res.data.data.items);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, data);
        toast.success('Customer updated successfully');
      } else {
        await api.post('/customers', data);
        toast.success('Customer created successfully');
      }
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleEdit = (customer) => {
    setEditingId(customer.id);
    api.get(`/customers/${customer.id}`).then(res => {
      const fullCust = res.data.data;
      setValue('first_name', fullCust.first_name);
      setValue('last_name', fullCust.last_name);
      setValue('email', fullCust.email);
      setValue('phone', fullCust.phone);
      setValue('dob', fullCust.dob.split('T')[0]); 
      setValue('address', fullCust.address);
      setValue('government_id', fullCust.government_id);
      setIsModalOpen(true);
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`);
        toast.success('Customer deleted');
        fetchCustomers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.patch(`/customers/${id}/restore`);
      toast.success('Customer restored');
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to restore');
    }
  };

  if (loading && customers.length === 0) {
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
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your insurance clients</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary w-64"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:ring-1 focus:ring-primary"
          >
            <option value="">Active</option>
            <option value="DELETED">Deleted</option>
          </select>
          <button
            onClick={() => { reset(); setEditingId(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Contact</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Policies</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">No customers found.</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <Link to={`/customers/${c.id}/profile`} className="text-primary hover:underline">
                        {c.first_name} {c.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{c.email}</div>
                      <div className="text-muted-foreground text-xs">{c.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {c.policies_count} Active
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {c.status !== 'DELETED' ? (
                        <>
                          <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 p-1">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleRestore(c.id)} className="text-green-600 hover:text-green-800 dark:text-green-400 p-1 font-medium text-xs">
                          Restore
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-card w-full max-w-2xl rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="customerForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input {...register('first_name')} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none" />
                    {errors.first_name && <p className="text-destructive text-xs mt-1">{errors.first_name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input {...register('last_name')} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none" />
                    {errors.last_name && <p className="text-destructive text-xs mt-1">{errors.last_name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" {...register('email')} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none" />
                    {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input type="tel" {...register('phone')} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none" />
                    {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date of Birth</label>
                    <input type="date" {...register('dob')} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none" />
                    {errors.dob && <p className="text-destructive text-xs mt-1">{errors.dob.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Government ID</label>
                    <input {...register('government_id')} className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none" disabled={!!editingId} />
                    {errors.government_id && <p className="text-destructive text-xs mt-1">{errors.government_id.message}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <textarea {...register('address')} rows="3" className="w-full border rounded px-3 py-2 bg-background focus:ring-1 focus:ring-primary outline-none"></textarea>
                    {errors.address && <p className="text-destructive text-xs mt-1">{errors.address.message}</p>}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" form="customerForm" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">Save Customer</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Customers;
