import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', data);
      login(res.data.data.user, res.data.data.access_token, res.data.data.refresh_token);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4 dark:bg-background">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5 dark:bg-card">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign In</h2>
          <p className="mt-2 text-sm text-muted-foreground">Access your insurance dashboard</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Email Address</label>
              <input
                type="email"
                {...register('email')}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="admin@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                {...register('password')}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:text-primary/80">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
