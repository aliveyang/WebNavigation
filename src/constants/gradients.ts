export const GRADIENTS = [
  ['from-pink-500', 'to-rose-500'],
  ['from-purple-500', 'to-indigo-500'],
  ['from-blue-400', 'to-cyan-400'],
  ['from-emerald-400', 'to-teal-500'],
  ['from-orange-400', 'to-red-500'],
  ['from-yellow-400', 'to-orange-500'],
  ['from-gray-600', 'to-gray-800'],
  ['from-indigo-400', 'to-purple-400'],
  ['from-fuchsia-500', 'to-pink-500'],
  ['from-slate-600', 'to-slate-900'],
  ['from-red-500', 'to-orange-500'],
  ['from-cyan-500', 'to-blue-500'],
  ['from-teal-400', 'to-emerald-500'],
];

export const getRandomGradient = () => {
  const idx = Math.floor(Math.random() * GRADIENTS.length);
  return { from: GRADIENTS[idx][0], to: GRADIENTS[idx][1] };
};
