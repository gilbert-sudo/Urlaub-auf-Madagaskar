const fs = require('fs');
const path = 'd:/PROJET LOGICIEL/Klaus/frontend/src/Pages/CreateTripPage.jsx';
let content = fs.readFileSync(path, 'utf8');

const sharedInputClass = "w-full px-5 py-3 rounded-full border-2 border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 focus:bg-white focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-semibold text-sm text-gray-800 placeholder:text-gray-400";
const sharedLabelClass = "text-[11px] font-extrabold text-gray-500 uppercase tracking-wider ml-2 mb-1.5 block";

// Insert constants
content = content.replace('export function CreateTripPage() {', `const SHARED_INPUT_CLASS = "${sharedInputClass}";\nconst SHARED_LABEL_CLASS = "${sharedLabelClass}";\n\nexport function CreateTripPage() {`);

// Replace old label classes
content = content.replace(/className="text-\[11px\] font-extrabold text-gray-400 uppercase tracking-wider"/g, 'className={SHARED_LABEL_CLASS}');

// Replace old space-y-2 for input containers with space-y-0
content = content.replace(/<div className="space-y-2">/g, '<div className="relative">');

// Fix specific inputs
content = content.replace(/className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary\/20 outline-none transition-all font-bold text-sm"/g, 'className={SHARED_INPUT_CLASS}');
content = content.replace(/className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 outline-none font-bold text-sm"/g, 'className={`${SHARED_INPUT_CLASS} opacity-70 cursor-not-allowed`}');

content = content.replace(/className="w-full p-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-brand-primary\/20 outline-none font-bold text-sm"/g, 'className={SHARED_INPUT_CLASS}');

content = content.replace(/className="w-full p-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none font-bold text-xs"/g, 'className={SHARED_INPUT_CLASS}');

content = content.replace(/className="flex-1 px-5 py-3.5 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-primary\/20 outline-none font-bold text-sm transition-all"/g, 'className={SHARED_INPUT_CLASS}');
content = content.replace(/className="flex-1 px-5 py-3.5 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500\/20 outline-none font-bold text-sm transition-all"/g, 'className={SHARED_INPUT_CLASS.replace("focus:border-brand-primary/40 focus:ring-brand-primary/10", "focus:border-red-500/40 focus:ring-red-500/10")}');

// Write back
fs.writeFileSync(path, content, 'utf8');
console.log('Done');
