// Point this at your deployed backend URL after Milestone 4.
// Left as localhost for local dev; swapped at deploy time.
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
    // Network failure reaching our OWN backend (backend down/unreachable),
    // distinct from the backend reporting a failure fetching the target URL.
    renderError({
      code: "CLIENT_NETWORK_ERROR",
      message: "Could not reach the audit service. Is the backend running?",
    });
  }
});

function setLoading() {
  submitBtn.disabled = true;
  submitBtn.textContent = "Auditing...";
  resultArea.innerHTML = `<p class="state-message">Fetching and analyzing the page...</p>`;
}

function resetButton() {
  submitBtn.disabled = false;
  submitBtn.textContent = "Audit";
}

function renderError(error) {
  resetButton();
  resultArea.innerHTML = `
    <div class="error-box">
      <span class="error-code">${escapeHtml(error?.code || "UNKNOWN_ERROR")}</span>
      ${escapeHtml(error?.message || "Something went wrong.")}
    </div>
  `;
}

function renderReport(data) {
  resetButton();

  const rows = [
    ["URL", data.url],
    ["HTTP status", data.httpStatus],
    ["Response time", `${data.responseTimeMs} ms`],
    ["Title", data.title || "—"],
    ["Meta description", data.metaDescription || "—"],
    ["H1 count", data.h1Count],
    ["Images missing alt text", data.imagesMissingAltCount],
    ["Word count (approx.)", data.wordCount],
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) => `
      <div class="report-row">
        <span class="label">${escapeHtml(label)}</span>
        <span class="value">${escapeHtml(String(value))}</span>
      </div>`
    )
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

  resultArea.innerHTML = `<div class="report">${rowsHtml}</div>${altListHtml}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}