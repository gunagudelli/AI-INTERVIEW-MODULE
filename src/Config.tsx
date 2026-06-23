// const userType = "live"

// const BASE_URL = userType === "live" 
//     ? "https://meta.oxyloans.com/api" 
//     : "https://meta.oxyglobal.tech/api";

// export default BASE_URL;

const userType: string = "local"; // Change to "live" for production

const BASE_URL =
  userType === "live"
    ? "https://interviews-zadn.onrender.com"
    : "http://localhost:3000";

const DEFAULT_CART_AGENT_BASE = `${BASE_URL}/cart-service/agent`;

/** 
 * Cart agent APIs (offers, chat) — always local cart-management-service in dev.
 * REACT_APP_CART_AGENT_BASE may override (e.g. /local-api/... via setupProxy.js).
 * Production meta URLs are ignored so offers never call meta.oxyloans.com.
 */
export function resolveCartAgentBase(): string {
  const fromEnv = process.env.REACT_APP_CART_AGENT_BASE?.trim().replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }
  return DEFAULT_CART_AGENT_BASE;
}

export const CART_AGENT_LOCAL_BASE = resolveCartAgentBase();
    
// encrypted URL
const encryptedUploadUrl =
"aHR0cHM6Ly9veHlicmlja3N2MS5zMy5hcC1zb3V0aC0xLmFtYXpvbmF3cy5jb20vbnVsbC80NTg4MGU2Mi1hY2FmLTQ2NDUtYTgzZS1kMWM4NDk4ZTkyM2U="

// decrypt function
export const uploadurlwithId = atob(encryptedUploadUrl);

export default BASE_URL;

