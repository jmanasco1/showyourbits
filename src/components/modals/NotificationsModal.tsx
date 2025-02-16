import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'like' | 'comment';
  postId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  read: boolean;
  createdAt: any;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

export default function NotificationsModal({ isOpen, onClose, anchorRef }: NotificationsModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Mark notifications as read when opened
  useEffect(() => {
    if (!user || !isOpen) return;

    const markNotificationsAsRead = async () => {
      try {
        const unreadNotifications = notifications.filter(n => !n.read);
        const updatePromises = unreadNotifications.map(notification => 
          updateDoc(doc(db, 'notifications', notification.id), {
            read: true
          })
        );
        await Promise.all(updatePromises);
        console.log('Marked notifications as read:', unreadNotifications.length);
      } catch (err) {
        console.error('Error marking notifications as read:', err);
      }
    };

    // Wait a bit before marking as read to ensure the animation is smooth
    const timer = setTimeout(markNotificationsAsRead, 1000);
    return () => clearTimeout(timer);
  }, [isOpen, notifications, user]);

  useEffect(() => {
    if (!user || !isOpen) return;

    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notificationData);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && 
          !panelRef.current.contains(event.target as Node) && 
          anchorRef.current && 
          !anchorRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if not already read
      if (!notification.read) {
        await updateDoc(doc(db, 'notifications', notification.id), {
          read: true
        });
      }
      
      // Close the modal
      onClose();
      
      // Navigate to the post
      navigate(`/?postId=${notification.postId}`);
    } catch (err) {
      console.error('Error handling notification click:', err);
    }
  };

  if (!isOpen) return null;

  // Calculate position based on anchor element
  const anchorRect = anchorRef.current?.getBoundingClientRect();
  const top = (anchorRect?.bottom ?? 0) + 8; // 8px gap
  const right = window.innerWidth - (anchorRect?.right ?? 0);

  return (
    <div 
      ref={panelRef}
      className="fixed bg-navy-900 rounded-lg shadow-xl border border-navy-700 w-96 max-h-[80vh] z-[100]"
      style={{
        top: `${top}px`,
        right: `${right}px`,
      }}
    >
      <div className="p-4 border-b border-navy-700">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Bell size={20} />
          Notifications
        </h3>
      </div>

      <div className="overflow-y-auto max-h-[calc(80vh-4rem)]">
        {notifications.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No notifications yet</p>
        ) : (
          <div className="divide-y divide-navy-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-4 p-4 hover:bg-navy-800 transition-colors cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-1">
                  <p className="text-white">
                    <span className="font-semibold">{notification.fromUserName}</span>{' '}
                    {notification.type === 'like' ? 'liked' : 'commented on'} your post
                  </p>
                  <p className="text-sm text-gray-400">
                    {formatDistanceToNow(notification.createdAt?.toDate(), { addSuffix: true })}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
