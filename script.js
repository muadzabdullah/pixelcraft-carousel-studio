"use strict";

/* =========================================================
   PIXELCRAFT CAROUSEL STUDIO
   Frontend Controller
   ========================================================= */


/* ---------------------------------------------------------
   DOM
--------------------------------------------------------- */

const topicInput = document.getElementById("topic");
const audienceInput = document.getElementById("audience");
const toneInput = document.getElementById("tone");
const slideCountInput = document.getElementById("slideCount");
const colorInput = document.getElementById("color");
const watermarkInput = document.getElementById("watermark");

const customStyleInput = document.getElementById("customStyle");
const customStyleField = document.getElementById("customStyleField");

const referenceImageInput =
  document.getElementById("referenceImage");

const uploadText =
  document.getElementById("uploadText");

const generateContentButton =
  document.getElementById("generateContent");

const generateVisualButton =
  document.getElementById("generateVisual");

const backToInputButton =
  document.getElementById("backToInput");

const copyAllJsonButton =
  document.getElementById("copyAllJson");

const inputPanel =
  document.getElementById("inputPanel");

const editorSection =
  document.getElementById("editorSection");

const resultsSection =
  document.getElementById("resultsSection");

const slidesEditor =
  document.getElementById("slidesEditor");

const visualResults =
  document.getElementById("visualResults");

const errorMessage =
  document.getElementById("errorMessage");

const editorStatus =
  document.getElementById("editorStatus");

const stepIndicator1 =
  document.getElementById("stepIndicator1");

const stepIndicator2 =
  document.getElementById("stepIndicator2");

const stepIndicator3 =
  document.getElementById("stepIndicator3");

const styleOptions =
  document.querySelectorAll(".style-option");


/* ---------------------------------------------------------
   STATE
--------------------------------------------------------- */

let selectedStyle = "3D Modern";
let carouselData = null;


/* ---------------------------------------------------------
   INITIALIZE
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

  setupStyleSelector();

  setupReferenceUpload();

  setupButtons();

  updateCustomStyleVisibility();

});


/* ---------------------------------------------------------
   STYLE SELECTOR
--------------------------------------------------------- */

function setupStyleSelector() {

  styleOptions.forEach((button) => {

    button.addEventListener("click", () => {

      styleOptions.forEach((item) => {
        item.classList.remove("selected");
      });

      button.classList.add("selected");

      selectedStyle =
        button.dataset.style || "3D Modern";

      updateCustomStyleVisibility();

    });

  });

}


function updateCustomStyleVisibility() {

  if (!customStyleField) {
    return;
  }

  if (selectedStyle === "Custom") {

    customStyleField.classList.add("active");

  } else {

    customStyleField.classList.remove("active");

  }

}


/* ---------------------------------------------------------
   REFERENCE IMAGE
--------------------------------------------------------- */

function setupReferenceUpload() {

  if (!referenceImageInput) {
    return;
  }

  referenceImageInput.addEventListener("change", () => {

    const file =
      referenceImageInput.files &&
      referenceImageInput.files[0];

    if (!file) {

      uploadText.textContent =
        "+ Add reference";

      return;
    }

    uploadText.textContent =
      file.name;

  });

}


/* ---------------------------------------------------------
   BUTTONS
--------------------------------------------------------- */

function setupButtons() {

  generateContentButton?.addEventListener(
    "click",
    generateContent
  );

  backToInputButton?.addEventListener(
    "click",
    showInputPanel
  );

  generateVisualButton?.addEventListener(
    "click",
    generateVisuals
  );

  copyAllJsonButton?.addEventListener(
    "click",
    copyAllJson
  );

}


/* ---------------------------------------------------------
   GENERATE CONTENT
--------------------------------------------------------- */

async function generateContent() {

  clearError();

  const topic =
    topicInput?.value.trim();

  if (!topic) {

    showError(
      "Tulis dulu topic atau ide carousel kamu."
    );

    topicInput?.focus();

    return;
  }


  const slideCount =
    Number(slideCountInput?.value || 5);


  const payload = {

    topic,

    audience:
      audienceInput?.value || "Creators",

    tone:
      toneInput?.value || "Educational",

    slideCount,

    color:
      colorInput?.value.trim() || "",

    style:
      selectedStyle,

    customStyle:
      customStyleInput?.value.trim() || "",

    watermark:
      watermarkInput?.value.trim() || ""

  };


  setButtonLoading(
    generateContentButton,
    true,
    "CREATING..."
  );


  try {

    const response =
      await fetch("/api/generate", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body:
          JSON.stringify(payload)

      });


    const data =
      await response.json().catch(() => ({}));


    if (!response.ok) {

      throw new Error(
        data.error ||
        `Request failed (${response.status})`
      );

    }


    if (
      !data.slides ||
      !Array.isArray(data.slides)
    ) {

      throw new Error(
        "Gemini tidak mengembalikan format carousel yang valid."
      );

    }


    carouselData = {
      slides: data.slides
    };


    renderSlidesEditor();

    showEditor();

    updateSteps(2);

  } catch (error) {

    console.error(error);

    showError(
      error.message ||
      "Terjadi kesalahan saat membuat carousel."
    );

  } finally {

    setButtonLoading(
      generateContentButton,
      false,
      "GENERATE CONTENT"
    );

  }

}


/* ---------------------------------------------------------
   RENDER SLIDE EDITOR
--------------------------------------------------------- */

function renderSlidesEditor() {

  if (!slidesEditor) {
    return;
  }

  slidesEditor.innerHTML = "";


  carouselData.slides.forEach(
    (slide, index) => {

      const slideElement =
        document.createElement("div");

      slideElement.className =
        "slide-editor";


      slideElement.innerHTML = `

        <div class="slide-header">

          <div class="slide-number">
            ${String(index + 1).padStart(2, "0")}
          </div>

          <div class="slide-role">
            ${escapeHtml(slide.role || "CONTENT")}
          </div>

        </div>


        <div class="slide-body">

          <div class="field">

            <label>
              Headline
            </label>

            <input
              type="text"
              class="slide-headline"
              data-index="${index}"
              value="${escapeAttribute(slide.headline || "")}"
            />

          </div>


          <div class="field">

            <label>
              Body
            </label>

            <textarea
              rows="4"
              class="slide-body-text"
              data-index="${index}"
            >${escapeHtml(slide.body || "")}</textarea>

          </div>


          <div class="field">

            <label>
              Visual Direction
            </label>

            <textarea
              rows="3"
              class="slide-visual-direction"
              data-index="${index}"
            >${escapeHtml(slide.visual_direction || "")}</textarea>

          </div>


          <div class="field">

            <label>
              Visual Prompt
            </label>

            <textarea
              rows="5"
              class="slide-visual-prompt"
              data-index="${index}"
            >${escapeHtml(slide.visual_prompt || "")}</textarea>

          </div>

        </div>

      `;


      slidesEditor.appendChild(
        slideElement
      );

    }
  );


  bindEditorInputs();

}


/* ---------------------------------------------------------
   EDITOR INPUTS
--------------------------------------------------------- */

function bindEditorInputs() {

  document
    .querySelectorAll(".slide-headline")
    .forEach((input) => {

      input.addEventListener(
        "input",
        (event) => {

          const index =
            Number(event.target.dataset.index);

          carouselData.slides[index].headline =
            event.target.value;

        }
      );

    });


  document
    .querySelectorAll(".slide-body-text")
    .forEach((input) => {

      input.addEventListener(
        "input",
        (event) => {

          const index =
            Number(event.target.dataset.index);

          carouselData.slides[index].body =
            event.target.value;

        }
      );

    });


  document
    .querySelectorAll(".slide-visual-direction")
    .forEach((input) => {

      input.addEventListener(
        "input",
        (event) => {

          const index =
            Number(event.target.dataset.index);

          carouselData.slides[index].visual_direction =
            event.target.value;

        }
      );

    });


  document
    .querySelectorAll(".slide-visual-prompt")
    .forEach((input) => {

      input.addEventListener(
        "input",
        (event) => {

          const index =
            Number(event.target.dataset.index);

          carouselData.slides[index].visual_prompt =
            event.target.value;

        }
      );

    });

}


/* ---------------------------------------------------------
   GENERATE VISUALS
--------------------------------------------------------- */

function generateVisuals() {

  clearError();

  if (
    !carouselData ||
    !Array.isArray(carouselData.slides)
  ) {

    showError(
      "Belum ada carousel yang bisa diproses."
    );

    return;

  }


  syncEditorData();

  renderVisualResults();

  showResults();

  updateSteps(3);

}


/* ---------------------------------------------------------
   SYNC EDITOR
--------------------------------------------------------- */

function syncEditorData() {

  if (!carouselData) {
    return;
  }


  document
    .querySelectorAll(".slide-headline")
    .forEach((input) => {

      const index =
        Number(input.dataset.index);

      carouselData.slides[index].headline =
        input.value;

    });


  document
    .querySelectorAll(".slide-body-text")
    .forEach((input) => {

      const index =
        Number(input.dataset.index);

      carouselData.slides[index].body =
        input.value;

    });


  document
    .querySelectorAll(".slide-visual-direction")
    .forEach((input) => {

      const index =
        Number(input.dataset.index);

      carouselData.slides[index].visual_direction =
        input.value;

    });


  document
    .querySelectorAll(".slide-visual-prompt")
    .forEach((input) => {

      const index =
        Number(input.dataset.index);

      carouselData.slides[index].visual_prompt =
        input.value;

    });

}


/* ---------------------------------------------------------
   RENDER VISUAL RESULTS
--------------------------------------------------------- */

function renderVisualResults() {

  if (!visualResults) {
    return;
  }

  visualResults.innerHTML = "";


  carouselData.slides.forEach(
    (slide, index) => {

      const card =
        document.createElement("article");

      card.className =
        "result-card";


      const jsonData = {
        slide: slide.slide || index + 1,
        role: slide.role || "CONTENT",
        headline: slide.headline || "",
        body: slide.body || "",
        visual_direction:
          slide.visual_direction || "",
        visual_prompt:
          slide.visual_prompt || ""
      };


      card.innerHTML = `

        <div class="slide-header">

          <div class="slide-number">
            ${String(index + 1).padStart(2, "0")}
          </div>

          <div class="slide-role">
            ${escapeHtml(slide.role || "CONTENT")}
          </div>

        </div>


        <div class="result-grid">

          <div class="visual-placeholder">

            <span>
              VISUAL DIRECTION
            </span>

            <strong>
              ${escapeHtml(
                slide.visual_direction || ""
              )}
            </strong>

          </div>


          <div class="prompt-panel">

            <div class="prompt-panel-top">

              <span>
                VISUAL PROMPT
              </span>

              <button
                class="copy-json"
                data-index="${index}"
                type="button"
              >
                Copy JSON
              </button>

            </div>


            <pre class="prompt-json">${escapeHtml(
              JSON.stringify(
                jsonData,
                null,
                2
              )
            )}</pre>

          </div>

        </div>

      `;


      visualResults.appendChild(card);

    }
  );


  document
    .querySelectorAll(".copy-json")
    .forEach((button) => {

      button.addEventListener(
        "click",
        async () => {

          const index =
            Number(button.dataset.index);

          const slide =
            carouselData.slides[index];

          const json = JSON.stringify(
            slide,
            null,
            2
          );

          await copyText(
            json,
            button
          );

        }
      );

    });

}


/* ---------------------------------------------------------
   COPY ALL JSON
--------------------------------------------------------- */

async function copyAllJson() {

  if (!carouselData) {
    return;
  }


  syncEditorData();


  const json =
    JSON.stringify(
      carouselData,
      null,
      2
    );


  await copyText(
    json,
    copyAllJsonButton
  );

}


/* ---------------------------------------------------------
   COPY HELPER
--------------------------------------------------------- */

async function copyText(
  text,
  button
) {

  try {

    await navigator.clipboard.writeText(
      text
    );


    const original =
      button.textContent;


    button.textContent =
      "Copied ✓";


    setTimeout(() => {

      button.textContent =
        original;

    }, 1400);


  } catch (error) {

    console.error(error);

    showError(
      "Clipboard tidak tersedia. Silakan copy manual."
    );

  }

}


/* ---------------------------------------------------------
   NAVIGATION
--------------------------------------------------------- */

function showInputPanel() {

  inputPanel?.classList.remove(
    "hidden"
  );

  editorSection?.classList.add(
    "hidden"
  );

  resultsSection?.classList.add(
    "hidden"
  );

  clearError();

  updateSteps(1);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


function showEditor() {

  inputPanel?.classList.add(
    "hidden"
  );

  editorSection?.classList.remove(
    "hidden"
  );

  resultsSection?.classList.add(
    "hidden"
  );

  editorSection?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


function showResults() {

  inputPanel?.classList.add(
    "hidden"
  );

  editorSection?.classList.add(
    "hidden"
  );

  resultsSection?.classList.remove(
    "hidden"
  );

  resultsSection?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

}


/* ---------------------------------------------------------
   STEP INDICATOR
--------------------------------------------------------- */

function updateSteps(activeStep) {

  const indicators = [
    stepIndicator1,
    stepIndicator2,
    stepIndicator3
  ];


  indicators.forEach(
    (indicator, index) => {

      if (!indicator) {
        return;
      }

      indicator.classList.toggle(
        "active",
        index + 1 === activeStep
      );

    }
  );

}


/* ---------------------------------------------------------
   LOADING STATE
--------------------------------------------------------- */

function setButtonLoading(
  button,
  loading,
  text
) {

  if (!button) {
    return;
  }


  button.disabled =
    loading;


  const span =
    button.querySelector("span");


  if (span) {

    if (!button.dataset.originalText) {

      button.dataset.originalText =
        span.textContent;

    }


    span.textContent =
      loading
        ? text
        : button.dataset.originalText;

  }

}


/* ---------------------------------------------------------
   ERROR
--------------------------------------------------------- */

function showError(message) {

  if (!errorMessage) {
    return;
  }

  errorMessage.textContent =
    message;

  errorMessage.classList.add(
    "visible"
  );


  errorMessage.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });

}


function clearError() {

  if (!errorMessage) {
    return;
  }

  errorMessage.textContent =
    "";

  errorMessage.classList.remove(
    "visible"
  );

}


/* ---------------------------------------------------------
   ESCAPE HTML
--------------------------------------------------------- */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

  return escapeHtml(value);

}
