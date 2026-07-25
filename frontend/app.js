// Point this at your deployed backend URL after Milestone 4.
const API_BASE = window.API_BASE_OVERRIDE || "http://localhost:3000";

const form = document.getElementById("audit-form");
const input = document.getElementById("url-input");
const submitBtn = document.getElementById("submit-btn");
const resultArea = document.getElementById("result-area");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = input.value.trim();
  if (!url) return;

  setLoading();

  try {
    const res = await fetch(
      `${API_BASE}/api/audit?url=${encodeURIComponent(url)}`
    );
    const body = await res.json();

    if (!res.ok || !body.success) {
      renderError(body.error);
      return;
    }

    renderReport(body.data);
  } catch (err) {
    renderError({
      code: "CLIENT_NETWORK_ERROR",
      message: "Could not reach the audit service. Is the backend running?",
    });
  }
});

function setLoading() {
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="btn-icon">⚡</span> Auditing...`;
  resultArea.innerHTML = `
    <div class="loading-box">
      <span class="spinner"></span>
      Fetching and analyzing the page...
    </div>`;
}

function resetButton() {
  submitBtn.disabled = false;
  submitBtn.innerHTML = `<span class="btn-icon">⚡</span> Audit`;
}

function renderError(error) {
  resetButton();
  resultArea.innerHTML = `
    <div class="error-box">
      <span class="error-icon">⚠️</span>
      <div class="error-body">
        <span class="error-code">${escapeHtml(error?.code || "UNKNOWN_ERROR")}</span>
        ${escapeHtml(error?.message || "Something went wrong.")}
      </div>
    </div>
  `;
}

function renderReport(data) {
  resetButton();

  const isOkStatus = data.httpStatus >= 200 && data.httpStatus < 300;
  const hasAltIssues = data.imagesMissingAltCount > 0;

  const metaBar = `
    <div class="report-meta">
      <span>${escapeHtml(data.url)}</span>
      <span class="status-pill ${isOkStatus ? "ok" : "warn"}">
        ${isOkStatus ? "●" : "▲"} HTTP ${data.httpStatus}
      </span>
    </div>`;

  const cards = [
    ["⏱", "Response Time", `${data.responseTimeMs} ms`, false],
    ["🏷", "Title", data.title || "—", false],
    ["📝", "Meta Description", data.metaDescription || "—", false, true],
    ["🔠", "H1 Count", data.h1Count, false],
    ["🖼", "Images Missing Alt", data.imagesMissingAltCount, hasAltIssues],
    ["📖", "Word Count (approx.)", data.wordCount, false],
  ];

  const cardsHtml = cards
    .map(([icon, label, value, isWarn, isFull]) => `
      <div class="metric-card ${isFull ? "full" : ""}">
        <div class="metric-label">${icon} ${escapeHtml(label)}</div>
        <div class="metric-value ${isWarn ? "warn" : ""}">${escapeHtml(String(value))}</div>
      </div>
    `)
    .join("");

  const altListHtml =
    data.imagesMissingAlt?.length > 0
      ? `<ul class="alt-list">${data.imagesMissingAlt
          .slice(0, 10)
          .map((src) => `<li>${escapeHtml(src)}</li>`)
          .join("")}${
          data.imagesMissingAlt.length > 10
            ? `<li>...and ${data.imagesMissingAlt.length - 10} more</li>`
            : ""
        }</ul>`
      : "";

  resultArea.innerHTML = `${metaBar}<div class="card-grid">${cardsHtml}</div>${altListHtml}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}