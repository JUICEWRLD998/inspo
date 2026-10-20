// Shared Playwright helpers for driving the console against `base44 dev` (local, throwaway data).
import { chromium } from "../../app/node_modules/playwright-core/index.mjs";
import { readdirSync } from "node:fs";

export const APP_ID = "6ad73f07dd0047fa4bb4fe2c";
export const BASE = process.env.CONSOLE_URL ?? "http://localhost:5173";

export async function launch() {
  const dir = readdirSync("/opt/pw-browsers").find((d) => d.startsWith("chromium-") && !d.includes("headless"));
  // PW_PROXY (e.g. $HTTPS_PROXY) is for driving the deployed app from the cloud container; local runs need none.
  return chromium.launch({ executablePath: `/opt/pw-browsers/${dir}/chrome-linux/chrome`, proxy: process.env.PW_PROXY ? { server: process.env.PW_PROXY } : undefined });
}

// Headless Chrome defaults to dark; always set the scheme explicitly.
export async function signedInPage(browser, { width = 390, height = 844, scheme = "light" } = {}) {
  const res = await fetch(`${BASE}/api/apps/${APP_ID}/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "fadhmusty@gmail.com", password: "local-dev" }),
  });
  const { access_token } = await res.json();
  if (!access_token) throw new Error("local login failed");
  const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width, height } });
  await ctx.addInitScript((t) => { localStorage.setItem("base44_access_token", t); localStorage.setItem("token", t); }, access_token);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|analytics|SDK Error|Error data|^\{|^\}|"error"/.test(m.text()) && errors.push(m.text()));
  return { page, ctx, errors, token: access_token };
}

export const api = async (token, path, init = {}) => {
  const res = await fetch(`${BASE}/api/apps/${APP_ID}/${path}`, {
    ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  return res.json();
};

// A DOM probe is only trusted once it fails on purpose: plant a known-bad and a known-good element first.
export async function plantedDisabledProbe(page) {
  await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend",
      '<button id="__ctl_off" disabled>off</button><button id="__ctl_on">on</button>');
  });
  const off = await page.locator("#__ctl_off").isDisabled();
  const on = await page.locator("#__ctl_on").isDisabled();
  await page.evaluate(() => document.querySelectorAll("#__ctl_off,#__ctl_on").forEach((n) => n.remove()));
  if (!off || on) throw new Error(`disabled probe is broken: off=${off} on=${on}`);
}
