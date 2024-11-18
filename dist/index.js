"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const generatePdfRoute_1 = __importDefault(require("./routes/generatePdfRoute"));
const app = (0, express_1.default)();
const port = 7301;
// Ensure downloads directory exists
const downloadsDir = (0, path_1.join)(__dirname, "downloads");
// await fs.mkdir(downloadsDir, { recursive: true });
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/downloads", express_1.default.static(downloadsDir));
app.use("/generate-pdf", generatePdfRoute_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: "Internal server error",
        details: err.message,
    });
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
