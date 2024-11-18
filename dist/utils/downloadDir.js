"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadDir = void 0;
const path_1 = require("path");
const promises_1 = __importDefault(require("fs/promises"));
const downloadDir = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const downloadsDir = (0, path_1.join)(__dirname, "downloads");
        yield promises_1.default.mkdir(downloadsDir, { recursive: true });
        return downloadsDir;
    }
    catch (e) {
        console.log(e);
    }
});
exports.downloadDir = downloadDir;
