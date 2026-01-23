import React from 'react';
import { Star } from 'lucide-react';

export const FreemiumBadge: React.FC<{ isPremium: boolean }> = ({ isPremium }) => {
  if (isPremium) {
    return (
      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm">
        <Star className="w-4 h-4" />
        <span>Premium Member</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-full font-medium text-sm">
      <span>Free Plan</span>
    </div>
  );
};
