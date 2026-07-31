import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Users, FileText, CreditCard, Activity, Settings } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Policies', path: '/policies', icon: FileText },
    { name: 'Claims', path: '/claims', icon: Activity },
    { name: 'Premiums', path: '/premiums', icon: CreditCard },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50/50 dark:bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-white dark:bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">AegisOne</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="mr-3 h-5 w-5 text-muted-foreground" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center pb-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground bg-background hover:bg-muted transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
