import { TMarkdownBody, TObj } from "../../types";

/** Maximum allowed markdown content size (500 KB). */
const MAX_MARKDOWN_BYTES = 500 * 1024;

/** Default values applied when a body field is missing or not provided. */
const DEFAULTS: TMarkdownBody = {
  markdown: "",
  title: "Document",
  size: "A4",
  landscape: false,
  scale: 100,
  printBackground: true,
  printHeaderFooter: false,
  margin: 0,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  save: false,
};

/**
 * Validates and normalises the raw JSON body of a `POST /markdown/generate`
 * request into a typed {@link TMarkdownBody} object.  Returns an error map
 * when required fields are missing or values fall outside allowed ranges.
 */
const validateMarkdownBody = (body: TObj) => {
  const errors: TObj = {};
  const parsed: TMarkdownBody = { ...DEFAULTS };

  // --- markdown (required) ---
  if (!body.markdown || typeof body.markdown !== "string") {
    errors.markdown = "markdown is required and must be a string";
  } else if (Buffer.byteLength(body.markdown, "utf8") > MAX_MARKDOWN_BYTES) {
    errors.markdown = `markdown must not exceed ${MAX_MARKDOWN_BYTES / 1024} KB`;
  } else {
    parsed.markdown = body.markdown;
  }

  // --- title (optional) ---
  if (body.title !== undefined) {
    if (typeof body.title !== "string") {
      errors.title = "title must be a string";
    } else {
      // Strip characters that would be unsafe in a filename
      parsed.title = body.title.trim().slice(0, 200) || "Document";
    }
  }

  // --- size ---
  const validSizes = ["A3", "A4", "A5", "Legal", "Letter"];
  if (!body.size) {
    parsed.size = "A4";
  } else if (!validSizes.includes(body.size)) {
    errors.size = `size must be one of ${validSizes.join(", ")}`;
  } else {
    parsed.size = body.size;
  }

  // --- landscape ---
  if (body.landscape !== undefined) {
    parsed.landscape = body.landscape === true || body.landscape === "true";
  }

  // --- scale (numeric, 70–150) ---
  if (body.scale !== undefined) {
    const scale = Number(body.scale);
    if (isNaN(scale) || scale < 70 || scale > 150) {
      errors.scale = "scale must be a number between 70 and 150";
    } else {
      parsed.scale = scale;
    }
  }

  // --- printBackground ---
  if (body.printBackground !== undefined) {
    parsed.printBackground = body.printBackground !== false && body.printBackground !== "false";
  }

  // --- printHeaderFooter ---
  if (body.printHeaderFooter !== undefined) {
    parsed.printHeaderFooter = body.printHeaderFooter === true || body.printHeaderFooter === "true";
  }

  // --- save ---
  if (body.save !== undefined) {
    parsed.save = body.save === true || body.save === "true";
  }

  // --- margins (all values must be non-negative numbers) ---
  const globalMargin = body.margin !== undefined ? Number(body.margin) : undefined;

  const margins: TObj = {
    marginTop:    body.marginTop    !== undefined ? Number(body.marginTop)    : globalMargin,
    marginRight:  body.marginRight  !== undefined ? Number(body.marginRight)  : globalMargin,
    marginBottom: body.marginBottom !== undefined ? Number(body.marginBottom) : globalMargin,
    marginLeft:   body.marginLeft   !== undefined ? Number(body.marginLeft)   : globalMargin,
  };

  for (const [key, value] of Object.entries(margins)) {
    if (value === undefined || value === null) {
      margins[key] = 0;
    } else if (isNaN(value as number) || (value as number) < 0) {
      errors[key] = `${key} must be a non-negative number`;
    }
  }

  parsed.margin = globalMargin !== undefined ? globalMargin : 0;
  Object.assign(parsed, margins);

  if (Object.keys(errors).length > 0) {
    return { error: true, message: errors };
  }

  return {
    error: false,
    message: "Valid request body",
    data: parsed,
  };
};

export default validateMarkdownBody;
