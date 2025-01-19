import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterProps {
  onFeedbackClick: () => void;
}

export default function Footer({ onFeedbackClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-6 px-4 border-t border-navy-700">
      <div className="max-w-3xl mx-auto flex flex-col items-center space-y-2 text-sm text-gray-400">
        <div className="flex items-center space-x-1">
          <span>Show Your Bits</span>
          <span>©</span>
          <span>{currentYear}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>Made with</span>
          <Heart size={14} className="text-red-500" />
          <span>for comedians</span>
        </div>
        <div className="flex space-x-4">
          <Link to="/privacy" className="hover:text-orange-500 transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-orange-500 transition-colors">Terms</Link>
          <button 
            onClick={onFeedbackClick}
            className="hover:text-orange-500 transition-colors"
          >
            Feedback
          </button>
        </div>
      </div>
    </footer>
  );
}
