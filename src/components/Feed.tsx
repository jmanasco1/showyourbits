import React from 'react';
import { Feed as FeedComponent } from './feed/Feed';

interface FeedProps {
  onProfileClick: (userId: string) => void;
}

export default function Feed({ onProfileClick }: FeedProps) {
  return <FeedComponent onProfileClick={onProfileClick} />;
}