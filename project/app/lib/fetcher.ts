export const fetchJsonOrNull = (url: string) => fetch(url).then(r => (r.ok ? r.json() : null))
