const floors = value => Number.isInteger(value) && value >= 0;
function validateAction(action, floorCount) {
    if (!action || typeof action !== 'object') return { valid: false, reason: 'action must be an object' };
    const type = action.type || 'noop';
    if (!['target', 'automation', 'power-up', 'noop'].includes(type)) return { valid: false, reason: 'unknown action type' };
    if (type === 'target' && (!floors(action.floor) || action.floor >= floorCount)) return { valid: false, reason: 'invalid target floor' };
    if (type === 'automation' && typeof action.mode !== 'string') return { valid: false, reason: 'invalid automation mode' };
    return { valid: true, action: { ...action, type } };
}
module.exports = { validateAction };
