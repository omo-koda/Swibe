"use strict";
/**
 * Swibe Compiler wrapper for VSCode Extension
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = exports.compile = void 0;
const path = __importStar(require("path"));
// Dynamically import the Swibe compiler from the main project
let compiler = null;
async function loadCompiler() {
    var _a;
    if (!compiler) {
        try {
            const compilerPath = path.resolve(__dirname, '../../src/compiler.js');
            compiler = await (_a = compilerPath, Promise.resolve().then(() => __importStar(require(_a))));
        }
        catch (error) {
            console.error('Failed to load Swibe compiler:', error);
            throw error;
        }
    }
    return compiler;
}
async function compile(source) {
    const comp = await loadCompiler();
    if (comp.compile) {
        return comp.compile(source);
    }
    return 'Compilation not available';
}
exports.compile = compile;
async function format(source) {
    const comp = await loadCompiler();
    if (comp.format) {
        return comp.format(source);
    }
    // Fallback: return source as-is if no formatter
    return source;
}
exports.format = format;
//# sourceMappingURL=swibe-compiler.js.map