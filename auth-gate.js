/**
 * Client-side site gate. Expects window.__SITE_PASSWORD_HASH__ from auth-config.js
 * (injected at GitHub Pages deploy time; never commit a real hash/password).
 */
(function () {
  "use strict";

  var STORAGE_KEY = "fs_intake_unlocked_v1";
  var APP_PATH = "app.html";
  var APP_ALIASES = {
    "app.html": true,
    "intake tracker.dc.html": true,
    "intake%20tracker.dc.html": true
  };

  function normalizePath(pathname) {
    var path = pathname || "/";
    if (path.endsWith("/")) path += "index.html";
    return decodeURIComponent(path.split("/").pop() || "index.html");
  }

  function isAppPage() {
    return !!APP_ALIASES[normalizePath(location.pathname).toLowerCase()];
  }

  function isGatePage() {
    var name = normalizePath(location.pathname).toLowerCase();
    return name === "index.html" || name === "" || name === "/";
  }

  function isUnlocked() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function setUnlocked() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {
      /* ignore */
    }
  }

  function clearUnlocked() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function hexFromBuffer(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(function (b) {
        return b.toString(16).padStart(2, "0");
      })
      .join("");
  }

  async function sha256Hex(text) {
    var data = new TextEncoder().encode(text);
    var digest = await crypto.subtle.digest("SHA-256", data);
    return hexFromBuffer(digest);
  }

  function expectedHash() {
    var hash = (window.__SITE_PASSWORD_HASH__ || "").trim().toLowerCase();
    if (!hash || hash.indexOf("REPLACE_") === 0 || hash === "unset") return "";
    return hash;
  }

  function redirectToGate() {
    var target = "index.html";
    if (location.pathname.indexOf("/") >= 0) {
      var base = location.pathname.replace(/[^/]*$/, "");
      target = base + "index.html";
    }
    location.replace(target + location.search + location.hash);
  }

  function redirectToApp() {
    location.replace(APP_PATH + location.search + location.hash);
  }

  async function verifyPassword(password) {
    var expected = expectedHash();
    if (!expected) {
      return {
        ok: false,
        message: "站点密码尚未配置。请在仓库 Secrets 中设置 SITE_PASSWORD 后重新部署。"
      };
    }
    if (!password) {
      return { ok: false, message: "请输入密码。" };
    }
    var actual = await sha256Hex(password);
    if (actual !== expected) {
      return { ok: false, message: "密码不正确，请重试。" };
    }
    setUnlocked();
    return { ok: true };
  }

  function guardApp() {
    if (!isAppPage()) return;
    if (isUnlocked()) return;
    redirectToGate();
  }

  function bootGateForm() {
    if (!isGatePage()) return;
    if (isUnlocked() && expectedHash()) {
      redirectToApp();
      return;
    }

    var form = document.getElementById("gate-form");
    var input = document.getElementById("gate-password");
    var error = document.getElementById("gate-error");
    var submit = document.getElementById("gate-submit");
    if (!form || !input) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (error) error.textContent = "";
      if (submit) {
        submit.disabled = true;
        submit.textContent = "验证中…";
      }
      verifyPassword(input.value)
        .then(function (result) {
          if (result.ok) {
            redirectToApp();
            return;
          }
          if (error) error.textContent = result.message;
          input.focus();
          input.select();
        })
        .catch(function () {
          if (error) error.textContent = "验证失败，请稍后再试。";
        })
        .finally(function () {
          if (submit) {
            submit.disabled = false;
            submit.textContent = "进入";
          }
        });
    });
  }

  window.SiteGate = {
    verifyPassword: verifyPassword,
    clearUnlocked: clearUnlocked,
    isUnlocked: isUnlocked
  };

  guardApp();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootGateForm);
  } else {
    bootGateForm();
  }
})();
