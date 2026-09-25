const $ = (selector) => document.querySelector(selector);

let generatedData = null;
let currentStep = 1;

// ===============================
// STYLE SELECTOR
// ===============================

const styleCards = document.querySelectorAll(".style-option");
const customStyleBox = $("#customStyle");

styleCards.forEach((card) => {
  card.addEventListener("click", () => {
    styleCards.forEach((item) => item.classList.remove("active"));
    card.classList.add("active");

    const value = card.dataset.style;

    if (customStyleBox) {
      customStyleBox.style.display =
        value === "Custom" ? "block" : "none";
    }
  });
});

// ===============================
// REFERENCE IMAGE
// ===============================

const referenceInput = $("#referenceImage");
const referenceName = $("#referenceName");

if (referenceInput) {
  referenceInput.addEventListener("change", () => {
    const file = referenceInput.files?.[0];

    if (referenceName) {
      referenceName.textContent = file
        ? file.name
        : "Belum ada referensi";
    }
  });
}

// ===============================
// STEP INDICATOR
// ===============================

function setStep(step) {
  currentStep = step;

  document.querySelectorAll(".step").forEach((item) => {
    const number = Number(item.dataset.step);

    item.classList.toggle("active", number === step);
    item.classList.toggle("completed", number < step);
  });
}

// ===============================
// HELPERS
// ===============================

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function prettyJSON(data) {
  return JSON.stringify(data, null, 2);
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);

    if (button) {
      const original = button.textContent;
      button.textContent = "✓ Copied";

      setTimeout(() => {
        button.textContent = original;
      }, 1500);
    }

    return true;
  } catch (error) {
    console.error("Copy failed:", error);

    // fallback
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
    } catch (err) {
      console.error(err);
    }

    textarea.remove();

    if (button) {
      const original = button.textContent;
      button.textContent = "✓ Copied";

      setTimeout(() => {
        button.textContent = original;
      }, 1500);
    }

    return true;
  }
}

function showLoading(show) {
  const button = $("#generateContent");

  if (!button) return;

  if (show) {
    button.disabled = true;
    button.dataset.originalText =
      button.textContent || "Generate Content";
    button.textContent = "Menyusun carousel...";
  } else {
    button.disabled = false;
    button.textContent =
      button.dataset.originalText || "Generate Content";
  }
}

function showError(message) {
  const errorBox = $("#errorMessage");

  if (!errorBox) {
    alert(message);
    return;
  }

  errorBox.textContent = message;
  errorBox.style.display = "block";
}

function hideError() {
  const errorBox = $("#errorMessage");

  if (errorBox) {
    errorBox.style.display = "none";
    errorBox.textContent = "";
  }
}

// ===============================
// BUILD PER-SLIDE PROMPT
// ===============================

function buildSlidePrompt(slide) {
  return `Create the visual for Slide ${slide.slide} of a carousel.

ROLE:
${slide.role}

HEADLINE:
${slide.headline}

BODY:
${slide.body}

VISUAL DIRECTION:
${slide.visual_direction}

COMPOSITION:
${slide.composition}

STYLE:
${slide.style}

VISUAL PROMPT:
${slide.visual_prompt}

NEGATIVE PROMPT:
${slide.negative_prompt}

IMPORTANT:
- Portrait 4:5 composition.
- Follow the visual direction precisely.
- Keep the composition clean and intentional.
- No humans.
- No faces.
- No eyes, nose, mouth, hands, arms, legs, body parts, silhouettes, characters, or animals.
- No random decorative objects.
- No unnecessary text inside the generated image.
- No logos or watermarks unless explicitly requested.
- Preserve the visual identity and style of the carousel.`;
}

// ===============================
// RENDER RESULTS
// ===============================

function renderResults(data) {
  generatedData = data;

  const resultSection = $("#results");
  const editorSection = $("#editor");

  if (editorSection) {
    editorSection.style.display = "none";
  }

  if (!resultSection) {
    console.warn("Results container not found.");
    return;
  }

  resultSection.style.display = "block";

  const fullJSON = prettyJSON(data);

  resultSection.innerHTML = `
    <div class="results-header">
      <div>
        <span class="eyebrow">PIXELCRAFT OUTPUT</span>
        <h2>Carousel prompt kamu sudah siap ✨</h2>
        <p>
          Pilih mau mengambil seluruh JSON sekaligus
          atau copy prompt visual per slide.
        </p>
      </div>
    </div>

    <div class="output-tabs">
      <button class="output-tab active" data-output-tab="full">
        Full JSON
      </button>

      <button class="output-tab" data-output-tab="slides">
        Per Slide
      </button>
    </div>

    <div id="fullOutput" class="output-panel active">

      <div class="output-card">
        <div class="output-card-header">
          <div>
            <strong>Full Carousel JSON</strong>
            <span>Semua struktur carousel dalam satu JSON.</span>
          </div>

          <button
            class="copy-button"
            id="copyFullJSON"
            type="button"
          >
            Copy Full JSON
          </button>
        </div>

        <pre class="json-output">${escapeHtml(fullJSON)}</pre>
      </div>

      <div class="next-step-card">

        <div class="next-step-title">
          <span>🎨</span>
          <div>
            <strong>Punya Canva Pro?</strong>
            <p>
              Kamu bisa membawa seluruh struktur carousel
              langsung ke Canva AI.
            </p>
          </div>
        </div>

        <ol>
          <li>Buka Canva dan buat desain baru.</li>
          <li>Buka Canva AI di dalam Canva.</li>
          <li>Copy <strong>Full JSON</strong> dari PixelCraft.</li>
          <li>Paste seluruh JSON ke chat Canva AI.</li>
          <li>
            Biarkan Canva AI membaca brief dan membantu
            mengolah prompt/visual sesuai struktur carousel.
          </li>
        </ol>

        <small>
          Canva Pro diperlukan untuk fitur AI tertentu,
          tergantung akun dan ketersediaan fitur.
        </small>

      </div>

    </div>

    <div id="slideOutput" class="output-panel">

      <div class="slide-output-intro">
        <strong>Generate visual satu per satu</strong>
        <p>
          Copy prompt tiap slide lalu gunakan di Google Flow
          untuk membuat visualnya satu per satu.
        </p>
      </div>

      <div id="slidePromptList"></div>

      <div class="flow-guide-card">

        <div class="next-step-title">
          <span>🎬</span>
          <div>
            <strong>Google Flow</strong>
            <p>
              Cocok kalau kamu mau generate visual
              satu per satu dengan kontrol lebih detail.
            </p>
          </div>
        </div>

        <ol>
          <li>Copy prompt dari slide yang ingin dibuat.</li>
          <li>Buka Google Flow.</li>
          <li>Paste prompt tersebut.</li>
          <li>Generate visualnya.</li>
          <li>Ulangi untuk slide berikutnya.</li>
        </ol>

        <small>
          Ketersediaan Flow dan model dapat berbeda
          berdasarkan akun dan wilayah.
        </small>

      </div>

    </div>
  `;

  renderSlidePrompts(data.slides || []);

  // Full JSON copy
  const copyFullButton = $("#copyFullJSON");

  if (copyFullButton) {
    copyFullButton.addEventListener("click", () => {
      copyText(fullJSON, copyFullButton);
    });
  }

  // Output tabs
  document.querySelectorAll(".output-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.outputTab;

      document
        .querySelectorAll(".output-tab")
        .forEach((item) => item.classList.remove("active"));

      document
        .querySelectorAll(".output-panel")
        .forEach((panel) => panel.classList.remove("active"));

      tab.classList.add("active");

      const targetPanel =
        target === "full"
          ? $("#fullOutput")
          : $("#slideOutput");

      if (targetPanel) {
        targetPanel.classList.add("active");
      }
    });
  });

  setStep(3);

  resultSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// ===============================
// RENDER SLIDE PROMPTS
// ===============================

function renderSlidePrompts(slides) {
  const container = $("#slidePromptList");

  if (!container) return;

  container.innerHTML = slides
    .map((slide) => {
      const prompt = buildSlidePrompt(slide);

      return `
        <article class="slide-prompt-card">

          <div class="slide-prompt-header">

            <div class="slide-number">
              ${escapeHtml(slide.slide)}
            </div>

            <div class="slide-meta">
              <strong>
                Slide ${escapeHtml(slide.slide)}
              </strong>

              <span>
                ${escapeHtml(slide.role)}
              </span>
            </div>

            <button
              class="copy-button slide-copy-button"
              type="button"
              data-prompt="${encodeURIComponent(prompt)}"
            >
              Copy Prompt
            </button>

          </div>

          <div class="slide-preview">

            <h3>
              ${escapeHtml(slide.headline)}
            </h3>

            <p>
              ${escapeHtml(slide.body)}
            </p>

            <div class="visual-direction">
              <span>VISUAL DIRECTION</span>
              <p>
                ${escapeHtml(slide.visual_direction)}
              </p>
            </div>

          </div>

          <details class="prompt-details">
            <summary>Preview prompt</summary>

            <pre>${escapeHtml(prompt)}</pre>
          </details>

        </article>
      `;
    })
    .join("");

  document
    .querySelectorAll(".slide-copy-button")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const encoded = button.dataset.prompt;

        let prompt = "";

        try {
          prompt = decodeURIComponent(encoded);
        } catch {
          prompt = encoded;
        }

        copyText(prompt, button);
      });
    });
}

// ===============================
// BACK TO INPUT
// ===============================

const backButton = $("#backToInput");

if (backButton) {
  backButton.addEventListener("click", () => {
    const results = $("#results");

    if (results) {
      results.style.display = "none";
    }

    const editor = $("#editor");

    if (editor) {
      editor.style.display = "none";
    }

    setStep(1);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

// ===============================
// GENERATE CONTENT
// ===============================

const generateButton = $("#generateContent");

if (generateButton) {
  generateButton.addEventListener("click", async () => {
    hideError();

    const topic = $("#topic")?.value?.trim() || "";

    const audience =
      $("#audience")?.value || "";

    const tone =
      $("#tone")?.value || "";

    const slideCount =
      Number($("#slideCount")?.value) || 7;

    const color =
      $("#color")?.value || "";

    const activeStyle =
      document.querySelector(".style-option.active");

    const style =
      activeStyle?.dataset?.style ||
      "Editorial Minimal";

    const customStyle =
      $("#customStyle")?.value?.trim() || "";

    const watermark =
      $("#watermark")?.value?.trim() || "";

    if (!topic) {
      showError(
        "Isi topik carousel dulu ya ✨"
      );

      $("#topic")?.focus();
      return;
    }

    setStep(2);
    showLoading(true);

    try {
      const response = await fetch(
        "/api/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            topic,
            audience,
            tone,
            slideCount,
            color,
            style,
            customStyle,
            watermark
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          "Gagal membuat carousel."
        );
      }

      if (
        !data.slides ||
        !Array.isArray(data.slides)
      ) {
        throw new Error(
          "AI tidak mengembalikan struktur carousel yang valid."
        );
      }

      renderResults(data);

    } catch (error) {
      console.error(error);

      setStep(1);

      showError(
        error?.message ||
        "Terjadi kesalahan. Coba lagi."
      );

    } finally {
      showLoading(false);
    }
  });
}

// ===============================
// INITIAL STATE
// ===============================

setStep(1);
