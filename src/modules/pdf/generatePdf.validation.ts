import { TObj, TQueryParams } from "../../types";

 const DEFAULT_QUERY: TQueryParams = {
  url: "",
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

const validatePDFQueryParams = (query: TObj) => {
  const errors: TObj = {};

  const parsedQuery: TQueryParams = DEFAULT_QUERY;

  // Validate and sanitize each parameter
  if (!query.url || typeof query.url !== "string") {
    errors.url = "url is required and must be a string";
  } else {
    parsedQuery.url = query.url;
  }

  // Validate size
  const validSizes = ["A3", "A4", "A5", "Legal", "Letter"];
  if (!query.size) {
    parsedQuery.size = "A4"; // Default
  } else if (!validSizes.includes(query.size)) {
    errors.size = `size must be one of ${validSizes.join(", ")}`;
  } else {
    parsedQuery.size = query.size;
  }

  // Fix title
  parsedQuery.title = query.title || "PDF";

  // Fix orientation
  parsedQuery.landscape =
    query.landscape !== undefined ? Boolean(query.landscape) : false;

  // Validate scale
  const scale = query.scale !== undefined ? Number(query.scale) : undefined;

  // Validate scale
  if (scale === undefined) {
    parsedQuery.scale = 100; // Default
  } else if (query.scale < 70 || query.scale > 150) {
    errors.scale = "scale must be a number between 70 and 150";
  } else {
    parsedQuery.scale = query.scale;
  }

  // Validate Background Options
  parsedQuery.printBackground =
    query.printBackground !== undefined ? Boolean(query.printBackground) : true;

  // Validate Header/Footer Options
  parsedQuery.printHeaderFooter =
    query.printHeaderFooter !== undefined
      ? Boolean(query.printHeaderFooter)
      : false;

  // Validate autoPrint and adjustSinglePage
  parsedQuery.autoPrint =
    query.autoPrint !== undefined ? Boolean(query.autoPrint) : false;

  // Validate autoPrint and adjustSinglePage
  parsedQuery.adjustSinglePage =
    query.adjustSinglePage !== undefined
      ? Boolean(query.adjustSinglePage)
      : false;

  // Handle margin and dependent sides
  const margin = query.margin !== undefined ? Number(query.margin) : undefined;
  const margins: TObj = {
    marginTop: query.marginTop !== undefined ? Number(query.marginTop) : margin,
    marginRight:
      query.marginRight !== undefined ? Number(query.marginRight) : margin,
    marginBottom:
      query.marginBottom !== undefined ? Number(query.marginBottom) : margin,
    marginLeft:
      query.marginLeft !== undefined ? Number(query.marginLeft) : margin,
  };

  // Apply default value of 0 for undefined margins
  for (const [key, value] of Object.entries(margins)) {
    if (value === undefined) {
      margins[key] = 0; // Default to 0
    } else if (isNaN(value) || value < 0) {
      errors[key] = `${key} must be a non-negative number`;
    }
  }

  // Merge margins into parsedQuery
  parsedQuery.margin = margin !== undefined ? margin : 0; // Overall margin if provided
  Object.assign(parsedQuery, margins);

  if (Object.keys(errors).length > 0) {
    return {
      error: true,
      message: errors,
    };
  }

  return {
    error: false,
    message: "Valid query params",
    data: parsedQuery,
  };
};

export default validatePDFQueryParams;

/* 
// Example usage:
const query = {
  url: "https://example.com",
  size: "A4",
  // landscape: true,
  scale: 100,
  printBackground: true,
  printHeaderFooter: false,
  autoPrint: false,
  adjustSinglePage: false,
  margin: 10,
  marginTop: 5,
  marginRight: 5,
  // marginBottom: 5,
  // marginLeft: 5,
};

const result = validatePDFQueryParams(query);

console.log(result, "result");

*/
