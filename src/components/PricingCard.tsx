import React from 'react';

interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  isPopular?: boolean;
  onSelect: () => void;
  tierName: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({ title, price, features, isPopular, onSelect }) => {
  return (
    <div 
      className={`relative flex flex-col p-6 rounded-2xl transition-all duration-300 ${
        isPopular 
          ? 'bg-white border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 transform scale-105 z-10' 
          : 'bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg'
      }`}
    >
      {isPopular && (
        <div className="absolute top-0 inset-x-0 -mt-3 flex justify-center">
           <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase bg-indigo-600 text-white shadow-md">
             En Çok Tercih Edilen
           </span>
        </div>
      )}
      
      <div className="mb-6 text-center">
        <h3 className={`text-base font-bold uppercase tracking-wider mb-2 ${isPopular ? 'text-indigo-600' : 'text-slate-500'}`}>
          {title}
        </h3>
        <div className="flex items-center justify-center gap-0.5">
          <span className={`text-4xl font-extrabold tracking-tight ${isPopular ? 'text-slate-900' : 'text-slate-700'}`}>{price}</span>
          {price !== 'Ücretsiz' && price !== 'Teklif Alın' && (
            <span className="text-sm font-semibold text-slate-400 self-end mb-1">TL</span>
          )}
        </div>
        {price !== 'Ücretsiz' && price !== 'Teklif Alın' && (
          <p className="text-xs text-slate-400 font-medium mt-1">/aylık</p>
        )}
      </div>

      <div className="flex-1 mb-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${isPopular ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className={`ml-3 text-xs sm:text-sm font-medium leading-snug ${isPopular ? 'text-slate-700' : 'text-slate-500'}`}>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onSelect}
        className={`w-full py-3 px-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 transform active:scale-95 ${
          isPopular
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:to-indigo-600'
            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-indigo-600'
        }`}
      >
        {price === 'Teklif Alın' ? 'İletişime Geç' : price === 'Ücretsiz' ? 'Hemen Başla' : 'Paketi Seç'}
      </button>
    </div>
  );
};