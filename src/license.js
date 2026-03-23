import { v4 as uuidv4 } from "uuid";

const LICENSE_API = "https://api-server.dev-dave.de/api"; 

export function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    try {
      id = window.crypto?.randomUUID?.() || uuidv4();
    } catch {
      id = uuidv4();
    }
    localStorage.setItem("deviceId", id);
  }
  return id;
}

export async function activateLicense(key) {
  const res = await fetch(`${LICENSE_API}/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ licenseKey: key, deviceId: getDeviceId() }),
  });

  if (!res.ok) throw new Error(await res.text());
  const { token } = await res.json();
  localStorage.setItem("licenseToken", token);
}

export async function verifyToken() {
  const token = localStorage.getItem("licenseToken");
  if (!token) return false;

  const res = await fetch(`${LICENSE_API}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, deviceId: getDeviceId() }),
  });

  return res.ok;
}

export async function checkToken() {
  const token = localStorage.getItem("licenseToken");
  const deviceId = getDeviceId();
  const res = await fetch(`${LICENSE_API}/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, deviceId }),
  });
  const data = await res.json();
  return data.valid;
}
