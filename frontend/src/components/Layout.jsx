import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Users, FileText, CreditCard, Activity, Settings, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/', icon: Home },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Policies', path: '/policies', icon: FileText },
    { name: 'Claims', path: '/claims', icon: Activity },
    { name: 'Premiums', path: '/premiums', icon: CreditCard },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-[#1A1D24] border-r border-border flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 relative">
        
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">AegisOne</h1>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-1 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'text-primary bg-primary/5 dark:bg-primary/10' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile Section */}
        <div className="p-4 mx-4 mb-4 mt-auto rounded-2xl bg-muted/50 border border-border/50">
          <div className="flex items-center mb-4">
            <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-sm border border-primary/20">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground truncate uppercase tracking-wider mt-0.5">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center px-4 py-2 border border-border/80 rounded-xl text-sm font-medium text-foreground bg-white dark:bg-[#1A1D24] shadow-sm hover:border-primary/30 hover:text-primary transition-all duration-200"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#F7F7F8] dark:bg-[#0F1115]">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
