// Entity fields are typed; sending null for a "string" field is a 500. Omit what is not known.
export const compact = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined));
