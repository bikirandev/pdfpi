import { TObj, TQueryParams } from "../../types";

/** Default values applied when a query parameter is missing or not provided. */
const DEFAULT_QUERY: TQueryParams = {
  url: "",
  id: "100",
  size: "A4",
  title: "print",
  landscape: false,
  scale: 100,
  printBackground: true,
  printHeaderFooter: false,
  autoPrint: false,
  adjustSinglePage: false,
  margin: 0,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
};

/**
 * Validates and normalises the raw Express query-string object into a typed
 * {@link TQueryParams} object.  Returns an error map when required fields are
 * missing or values fall outside allowed ranges.
 */
const validatePDFQueryParams = (query: TObj) => {
  const errors: TObj = {};

  // Start from a copy of defaults so unset fields are always populated
  const parsedQuery: TQueryParams = { ...DEFAULT_QUERY };

  // --- url (required) ---
  if (!query.url || typeof query.url !== "string") {
    errors.url = "url is required and must be a string";
  } else {
    parsedQuery.url = query.url;
  }

  // --- id (required) ---
  if (!query.id || typeof query.id !== "string") {
    errors.id = "id is required and must be a string";
  } else {
    parsedQuery.id = query.id;
  }

  // --- size ---
  const validSizes = ["A3", "A4", "A5", "Legal", "Letter"];
  if (!query.size) {
    parsedQuery.size = "A4"; // default
  } else if (!validSizes.includes(query.size)) {
    errors.size = `size must be one of ${validSizes.join(", ")}`;
  } else {
    parsedQuery.size = query.size;
  }

  // --- title ---
  parsedQuery.title = query.title || "PDF";

  // --- landscape ---
  parsedQuery.landscape = query.landscape === "true";

  // --- scale (numeric, 70–150) ---
  const scale = query.scale !== undefined ? Number(query.scale) : undefined;
  if (scale === undefined) {
    parsedQuery.scale = 100; // default
  } else if (isNaN(scale) || scale < 70 || scale > 150) {
    errors.scale = "scale must be a number between 70 and 150";
  } else {
    parsedQuery.scale = scale;
  }

  // --- background / header-footer / behaviour flags ---
  parsedQuery.printBackground = query.printBackground === "true";
  parsedQuery.printHeaderFooter = query.printHeaderFooter === "true";
  parsedQuery.autoPrint = query.autoPrint === "true";
  parsedQuery.adjustSinglePage = query.adjustSinglePage === "true";

  // --- margins (all values must be non-negative numbers) ---
  const globalMargin =
    query.margin !== undefined ? Number(query.margin) : undefined;

  const margins: TObj = {
    marginTop:
      query.marginTop !== undefined ? Number(query.marginTop) : globalMargin,
    marginRight:
      query.marginRight !== undefined
        ? Number(query.marginRight)
        : globalMargin,
    marginBottom:
      query.marginBottom !== undefined
        ? Number(query.marginBottom)
        : globalMargin,
    marginLeft:
      query.marginLeft !== undefined ? Number(query.marginLeft) : globalMargin,
  };

  for (const [key, value] of Object.entries(margins)) {
    if (value === undefined || value === null) {
      margins[key] = 0; // default to 0 when not provided
    } else if (isNaN(value as number) || (value as number) < 0) {
      errors[key] = `${key} must be a non-negative number`;
    }
  }

  parsedQuery.margin = globalMargin !== undefined ? globalMargin : 0;
  Object.assign(parsedQuery, margins);

  if (Object.keys(errors).length > 0) {
    return { error: true, message: errors };
  }

  return {
    error: false,
    message: "Valid query params",
    data: parsedQuery,
  };
};

export default validatePDFQueryParams;
