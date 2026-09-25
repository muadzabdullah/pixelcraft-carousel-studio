export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
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
        error: "Topic is required."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is not configured in Vercel."
      });
    }

    const count = Math.min(
      Math.max(Number(slideCount) || 5, 5),
      10
    );

    const systemPrompt = `
You are the AI Creative Director behind
PIXELCRAFT CAROUSEL STUDIO.

Your job is to create sophisticated,
intentional, non-generic carousel content.

The product is NOT limited to religious content.
It can be used for creators, businesses,
educators, marketers and general audiences.

CORE DESIGN PHILOSOPHY:

Create clean, modern, editorial-quality visuals.

Never create generic AI-looking compositions.

Avoid:
- visual clutter
- excessive decorative elements
- random floating objects
- unnecessary gradients
- cheesy 3D objects
- excessive glassmorphism
- generic futuristic decoration
- meaningless symbols
- visual metaphors
- overcrowded layouts

Every object must have a clear relationship
to the slide content.

Use generous negative space.

Create a strong visual hierarchy.

The design should feel intentionally art-directed,
not automatically generated.

ABSOLUTE VISUAL SAFETY RULE:

No humans.
No human faces.
No silhouettes.
No body parts.
No animals.
No living beings.
No characters.

The visual concept must work entirely
without living beings.

VISUAL STYLE:
${style || "3D Modern"}

CUSTOM STYLE:
${customStyle || "None"}

AUDIENCE:
${audience || "Creators"}

TONE:
${tone || "Educational"}

DOMINANT COLOR:
${color || "Choose an appropriate restrained palette"}

WATERMARK:
${watermark || "None"}

NUMBER OF SLIDES:
${count}

CONTENT TOPIC:
${topic}

CONTENT RULES:

Create exactly ${count} logical carousel slides.

Slide 1 must have a strong hook.

Middle slides should develop
the idea naturally.

The final slide should provide
a useful conclusion, takeaway,
or CTA when appropriate.

Write concise, natural,
human-sounding copy.

Do not use generic AI phrases such as:
"unlock your potential",
"dive into",
"in today's fast-paced world",
"revolutionize",
"game changer",
unless the topic genuinely requires them.

Each slide must feel connected
to the previous slide.

HEADLINES:

Keep headlines concise.

Avoid unnecessarily long paragraphs
inside headlines.

BODY:

Keep body copy easy to scan.

VISUAL DIRECTION:

Explain the art direction of the slide
in a concise but useful way.

VISUAL PROMPT:

Write a complete image-generation prompt.

Every visual prompt must explicitly include:

No humans.
No faces.
No silhouettes.
No body parts.
No animals.
No living beings.
No characters.

Do not put readable text into the image
unless typography is specifically the visual concept.

Use 4:5 vertical composition.

Return ONLY JSON matching the provided schema.
`;

    const schema = {
      type: "object",
      properties: {
        slides: {
          type: "array",
          minItems: count,
          maxItems: count,
          items: {
            type: "object",
            properties: {
              slide: {
                type: "integer"
              },
              role: {
                type: "string"
              },
              headline: {
                type: "string"
              },
              body: {
                type: "string"
              },
              visual_direction: {
                type: "string"
              },
              visual_prompt: {
                type: "string"
              }
            },
            required: [
              "slide",
              "role",
              "headline",
              "body",
              "visual_direction",
              "visual_prompt"
            ],
            additionalProperties: false
          }
        }
      },
      required: ["slides"],
      additionalProperties: false
    };

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
              role: "user",
              parts: [
                {
                  text: systemPrompt
                }
              ]
            }
          ],

          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.8
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return res.status(500).json({
        error: "Gemini returned an empty response."
      });
    }

    let result;

    try {
      result = JSON.parse(rawText);
    } catch (parseError) {
      console.error(
        "Gemini JSON parse error:",
        rawText
      );

      return res.status(500).json({
        error:
          "Gemini returned invalid JSON."
      });
    }

    if (
      !result.slides ||
      !Array.isArray(result.slides)
    ) {
      return res.status(500).json({
        error:
          "Gemini response does not contain slides."
      });
    }

    return res.status(200).json({
      slides: result.slides
    });

  } catch (error) {

    console.error(
      "Unexpected API error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Unexpected server error."
    });
  }
}
