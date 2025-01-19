import React from 'react';
import { X } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0A1324] text-white p-6 rounded-lg w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Send Feedback</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-400 mb-6">
          We value your feedback! Please send your comments, suggestions, or report any issues to:
        </p>
        
        <p className="text-blue-400 text-lg font-medium text-center mb-6">
          showyourbits@protonmail.com
        </p>

        <p className="text-gray-400 text-sm">
          We read every email and appreciate your help in making Show Your Bits better!
        </p>
      </div>
    </div>
  );
}