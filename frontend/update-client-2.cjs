const fs = require('fs');
const path = 'd:/PROJET LOGICIEL/Klaus/frontend/src/Components/ClientSelect.jsx';
let content = fs.readFileSync(path, 'utf8');
const oldClass = 'className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all"';
const newClass = 'className="w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400"';
content = content.split(oldClass).join(newClass);
fs.writeFileSync(path, content, 'utf8');
