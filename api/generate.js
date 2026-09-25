export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY belum tersedia di Vercel."
      });
    }

    const {
      topic,
      audience,
      tone,
      slideCount,
      color,
      style,
      customStyle,
      watermark
    } = req.body || {};

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        error: "Topik carousel belum diisi."
      });
    }

    const count = Math.min(
      10,
      Math.max(5, Number(slideCount) || 7)
    );

    const selectedStyle =
      style === "Custom"
        ? customStyle || "Clean editorial minimal"
        : style || "Editorial Minimal";

    const prompt = `
You are PixelCraft Carousel Studio.

Your job is to create a sophisticated, intentional carousel concept and production-ready visual prompts.

IMPORTANT:
You are NOT generating images.
You are ONLY generating structured JSON containing:
1. Carousel copy
2. Visual direction
3. Detailed visual prompts for each slide

USER INPUT:

Topic:
${topic}

Target audience:
${audience || "General audience"}

Tone:
${tone || "Friendly and informative"}

Number of slides:
${count}

Main color:
${color || "Not specified"}

Visual style:
${selectedStyle}

Watermark:
${watermark || "None"}

PIXELCRAFT CREATIVE DIRECTION:

- Sophisticated
- Modern editorial
- Intentional composition
- Clean and premium
- Strong visual hierarchy
- Generous negative space
- Avoid generic AI-looking visuals
- Avoid visual clutter
- Avoid random decorative objects
- Avoid meaningless symbols
- Avoid excessive gradients
- Avoid excessive glassmorphism
- Avoid cheesy futuristic decoration
- Avoid generic 3D decoration
- Every visual element must have a purpose
- Typography and composition should feel designed by a professional designer
- Visual concepts must support the message of the slide
- Do not simply repeat the headline visually
- Use varied composition between slides while maintaining one visual system

ABSOLUTE VISUAL SAFETY:

Do NOT include:
- Humans
- Faces
- Eyes
- Nose
- Mouth
- Hands
- Arms
- Legs
- Body parts
- Silhouettes
- Characters
- Animals
- Living creatures

Use objects, abstract forms, typography, environments, textures, materials, architecture, food, stationery, technology objects, geometric compositions, or other non-living visual elements when appropriate.

CAROUSEL STRUCTURE:

Slide 1:
Strong hook. Make the audience want to continue.

Middle slides:
Develop the idea naturally.
Do not make every slide sound like a separate social-media hook.
Create a logical progression.

Final slide:
Conclusion, takeaway, or CTA that naturally closes the carousel.

COPY RULES:

- Write concise human-sounding copy.
- Avoid generic AI phrases.
- Avoid repetitive sentence structures.
- Avoid unnecessary emojis.
- Avoid exaggerated clickbait.
- Headlines should be strong but natural.
- Body copy should be easy to read in a carousel.
- Keep each slide focused on ONE main idea.

VISUAL PROMPT RULES:

Each visual_prompt must be detailed enough to paste directly into an image-generation model.

Every visual_prompt MUST include:
- visual subject
- composition
- camera/viewpoint when relevant
- lighting
- material/texture when relevant
- color direction
- visual style
- negative constraints
- 4:5 portrait composition

Do not put written text, letters, words, logos, UI screenshots, or watermarks inside generated imagery unless the user explicitly requests them.

The carousel should feel like ONE designed campaign, not unrelated images.

OUTPUT ONLY VALID JSON.
NO MARKDOWN.
NO CODE FENCE.
NO EXPLANATION OUTSIDE JSON.

The JSON must contain exactly this structure:

{
  "project_summary": "...",
  "creative_direction": "...",
  "slides": [
    {
      "slide": 1,
      "role": "hook",
      "headline": "...",
      "body": "...",
      "visual_direction": "...",
      "visual_prompt": "...",
      "composition": "...",
      "style": "...",
      "negative_prompt": "..."
    }
  ]
}

There must be exactly ${count} slides.

The "slide" numbers must start at 1 and continue sequentially until ${count}.

Make every visual_prompt independently usable.

Make sure the final JSON is valid and contains no trailing commas.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                project_summary: {
                  type: "STRING"
                },
                creative_direction: {
                  type: "STRING"
                },
                slides: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      slide: {
                        type: "INTEGER"
                      },
                      role: {
                        type: "STRING"
                      },
                      headline: {
                        type: "STRING"
                      },
                      body: {
                        type: "STRING"
                      },
                      visual_direction: {
                        type: "STRING"
                      },
                      visual_prompt: {
                        type: "STRING"
                      },
                      composition: {
                        type: "STRING"
                      },
                      style: {
                        type: "STRING"
                      },
                      negative_prompt: {
                        type: "STRING"
                      }
                    },
                    required: [
                      "slide",
                      "role",
                      "headline",
                      "body",
                      "visual_direction",
                      "visual_prompt",
                      "composition",
                      "style",
                      "negative_prompt"
                    ]
                  }
                }
              },
              required: [
                "project_summary",
                "creative_direction",
                "slides"
              ]
            },
            temperature: 0.8
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      const message =
        data?.error?.message ||
        "Gemini gagal memproses permintaan.";

      return res.status(response.status).json({
        error: message
      });
    }

    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return res.status(502).json({
        error: "Gemini tidak mengembalikan hasil JSON."
      });
    }

    let result;

    try {
      result = JSON.parse(rawText);
    } catch (parseError) {
      console.error("JSON parse error:", rawText);

      return res.status(502).json({
        error: "Hasil dari Gemini bukan JSON yang valid."
      });
    }

    if (
      !result.slides ||
      !Array.isArray(result.slides) ||
      result.slides.length !== count
    ) {
      return res.status(502).json({
        error: "Jumlah slide dari AI tidak sesuai."
      });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Terjadi kesalahan pada server."
    });
  }
}
