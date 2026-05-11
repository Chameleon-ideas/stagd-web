// Module-level singleton — shared between Header and the messages page
// so the header knows which conversation is actively open.
let _activeConvId: string | null = null;

export const setViewingConv = (id: string | null) => { _activeConvId = id; };
export const getViewingConv = () => _activeConvId;
