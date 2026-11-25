// Gọi hàm app_ai_* trên Supabase; ?gia=1 dùng dữ liệu giả trong bộ nhớ (để thử, không cần mạng).
export const GIA = new URLSearchParams(location.search).has('gia');
let mod = null;
const lay = async () => (mod ||= await import(GIA ? './api_gia.js' : './sb.js'));
export async function rpc(ten, args = {}) { return (await lay()).rpc(ten, args); }
export async function da_dang_nhap() { return (await lay()).da_dang_nhap(); }
