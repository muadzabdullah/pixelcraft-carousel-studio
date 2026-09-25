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
    } = req.body;


    if (!topic) {

      return res.status(400).json({
        error: "Topic is required."
      });

    }


    const apiKey =
      process.env.GEMINI_API_KEY;


    if (!apiKey) {

      return res.status(500).json({
        error:
          "Gemini API key is not configured yet."
      });

    }


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

The requested visual style may change,
but the design discipline must remain.

VISUAL STYLE:
${style}

CUSTOM STYLE:
${customStyle || "None"}

AUDIENCE:
${audience}

TONE:
${tone}

DOMINANT COLOR:
${color || "Choose an appropriate restrained palette"}

WATERMARK:
${watermark || "None"}

NUMBER OF SLIDES:
${slideCount}

CONTENT TOPIC:
${topic}

CONTENT RULES:

Create a logical carousel.

Slide 1 must have a strong hook.

The following slides should develop
the idea naturally.

The final slide should provide a useful conclusion,
takeaway or CTA when appropriate.

Write concise human-sounding copy.

Do not use generic AI phrases such as:
"unlock your potential",
"dive into",
"in today's fast-paced world",
"revolutionize",
"game changer",
unless the topic genuinely requires them.

OUTPUT:

Return ONLY valid JSON.

Do not use markdown.

Use this exact structure:

{
  "slides": [
    {
      "slide": 1,
      "role": "HOOK",
      "headline": "...",
      "body": "...",
      "visual_direction": "...",
      "visual_prompt": "..."
    }
  ]
}

The slides array must contain exactly
the requested number of slides.

Each visual_prompt must describe
a complete visual composition.

Do not put text into the generated image
unless the visual style specifically requires
typography.

The visual prompt must repeat the
no-living-beings rule.

`;


    /*
      IMPORTANT:

      The exact Gemini model endpoint will be
      connected here after we choose the current
      Gemini API model for production.

      This placeholder keeps the Vercel
      architecture clean.
    */


    return res.status(200).json({

      slides: createDemoSlides(
        topic,
        slideCount,
        style
      )

    });


  } catch (error) {

    return res.status(500).json({
      error: error.message ||
        "Unexpected server error."
    });

  }

}


/*
  TEMPORARY DEMO GENERATOR

  This lets us test the entire UI BEFORE
  connecting the real Gemini model.
*/

function createDemoSlides(topic, count, style) {

  const slides = [];

  for (let i = 1; i <= count; i++) {

    let role = "CONTENT";

    if (i === 1) {
      role = "HOOK";
    }

    if (i === count) {
      role = "CTA";
    }

    slides.push({

      slide: i,

      role,

      headline:
        i === 1
          ? `A better way to think about ${topic}`
          : i === count
            ? "Save this for later."
            : `Key idea ${i}: keep it simple`,

      body:
        i === 1
          ? "Start with one clear idea and build everything around it."
          : i === count
            ? "Small improvements in clarity can completely change how your content feels."
            : "Focus on the message first. The visual treatment should support the idea, not compete with it.",

      visual_direction:
        `${style} visual treatment with a restrained editorial composition.`,

      visual_prompt:
        `Premium ${style} editorial visual about ${topic}. Clean composition, generous negative space, carefully selected relevant objects, sophisticated art direction, no clutter, no random decorative objects, no visual metaphors, no humans, no faces, no silhouettes, no body parts, no animals, no living beings. 4:5 vertical.`
    });

  }

  return slides;

}