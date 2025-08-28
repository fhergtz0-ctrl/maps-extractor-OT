/* controllers/localModel.js
 * Estado por defecto y utilidades de sesión.
 */

export const defaults = {
  keywords: ['Restaurante'],
  locations: ['Hermosillo - Sonora', 'Nogales - Sonora'],
  emailTimeoutSec: 10,
  taskList: [],
  running: false,
};

export function buildTaskList(keywords = [], locations = []) {
  const tasks = [];
  keywords.forEach((k) => {
    locations.forEach((l) => tasks.push({ keyword: k, location: l }));
  });
  return tasks;
}
