import React from 'react';

export const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
      <div className="max-w-lg mx-auto px-4 py-4 pb-24 animate-fade-in">
        {children}
      </div>
    </main>
  );
};

