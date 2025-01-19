import React from 'react';
import { MessageCircle } from 'react-feather';

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-gray-100 mb-4">Welcome to Show Your Bits</h2>
        <p className="text-gray-300">
          We value your input! Help us improve Show Your Bits by sharing your thoughts, suggestions, or reporting any issues.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openFeedback'))}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
        >
          <MessageCircle size={20} />
          <span>Send Feedback</span>
        </button>
      </div>
    </div>
  );
}