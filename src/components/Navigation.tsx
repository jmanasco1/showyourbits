import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PenTool, Mic2, Target, Lightbulb, Home, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import NotificationsModal from './modals/NotificationsModal';

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
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const currentPath = location.pathname === '/' ? '/feed' : location.pathname;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

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
      {user && (
        <button
          ref={notificationButtonRef}
          className="relative p-2 hover:bg-navy-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      )}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        anchorRef={notificationButtonRef}
      />
    </nav>
  );
}