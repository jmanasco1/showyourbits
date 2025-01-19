import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PenTool, Mic2, Target, Lightbulb, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
}

function NavItem({ icon, label, to, active }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          isActive || active
            ? 'bg-navy-800 text-white font-semibold'
            : 'text-gray-400 hover:bg-navy-800 hover:text-white'
        }`
      }
    >
      {icon}
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

export default function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname === '/' ? '/feed' : location.pathname;

  return (
    <nav className="flex items-center justify-center space-x-8 py-4 bg-navy-900">
      <NavItem
        icon={<Home size={20} />}
        label="Feed"
        to="/feed"
      />
      <NavItem
        icon={<PenTool size={20} />}
        label="Write"
        to="/write"
      />
      <NavItem
        icon={<Mic2 size={20} />}
        label="Practice"
        to="/practice"
      />
      <NavItem
        icon={<Target size={20} />}
        label="Goals"
        to="/goals"
      />
      <NavItem
        icon={<Lightbulb size={20} />}
        label="Ideas"
        to="/ideas"
      />
    </nav>
  );
}