import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

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
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100] pt-20">
      <div className="bg-navy-900 rounded-lg p-6 max-w-md w-full mx-4 border border-navy-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell size={20} />
            Notifications
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No notifications yet</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-navy-800 transition-colors"
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
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
