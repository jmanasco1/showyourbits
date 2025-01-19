import React, { useState } from 'react';
import Footer from './Footer';
import FeedbackModal from './modals/FeedbackModal';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  return (
    <>
      {children}
      <Footer onFeedbackClick={() => setShowFeedbackModal(true)} />
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </>
  );
}
