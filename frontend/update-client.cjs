const fs = require('fs');
const path = 'd:/PROJET LOGICIEL/Klaus/frontend/src/Components/ClientSelect.jsx';
let content = fs.readFileSync(path, 'utf8');

const sharedInputClass = "w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400";

// Replace main dropdown trigger
content = content.replace(
  /<div className={`relative border-2 rounded-xl transition-all duration-300 bg-white \$\{isOpen \? 'border-brand-primary ring-4 ring-brand-primary\\/10' : 'border-slate-200 hover:border-brand-primary'\}`}>/,
  `<div className={\`relative border-2 rounded-full transition-all duration-300 bg-gray-50/50 \$\{isOpen ? 'border-brand-primary bg-white ring-4 ring-brand-primary/10' : 'border-gray-100 hover:bg-gray-50 hover:border-gray-200'\}\`}>`
);

content = content.replace(
  /className={`absolute -top-2\.5 left-3 inline-block bg-white px-1 text-\[11px\] font-extrabold uppercase tracking-wider transition-colors duration-300 \$\{isOpen \? 'text-brand-primary' : 'text-slate-500'\}`}/,
  `className={\`absolute -top-2.5 left-4 inline-block bg-white px-1.5 text-[11px] font-extrabold uppercase tracking-wider transition-colors duration-300 \$\{isOpen ? 'text-brand-primary' : 'text-gray-500'\}\`}`
);

// Replace Add modal buttons
content = content.replace(
  /className="bg-brand-primary text-white px-8 py-3 rounded-xl text-sm font-black hover:bg-brand-secondary hover:shadow-lg hover:shadow-brand-primary\/30 hover:-translate-y-0\.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:shadow-none"/,
  `className="bg-brand-primary text-white px-8 py-3 rounded-full text-sm font-semibold shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary hover:shadow-brand-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:shadow-none"`
);

content = content.replace(
  /className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary\/20 focus:bg-white transition-all"/g,
  `className="${sharedInputClass}"`
);

// Search input inside dropdown
content = content.replace(
  /className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary\/20 transition-all"/,
  `className="w-full pl-9 pr-4 py-3 bg-gray-50 border-none rounded-full text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"`
);

fs.writeFileSync(path, content, 'utf8');
console.log('ClientSelect updated');
