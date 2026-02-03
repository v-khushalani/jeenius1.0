import React from 'react';
import Header from '@/components/Header';
import BatchExplorer from '@/components/BatchExplorer';

const BatchesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <BatchExplorer />
        </div>
      </div>
    </div>
  );
};

export default BatchesPage;
