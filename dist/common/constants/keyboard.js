"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NUMPAD_LAYOUT = exports.KEYBOARD_LAYOUT = exports.COMMON_COORDINATES = exports.scaleCoordinates = void 0;
const config_1 = require("./config");
const scaleCoordinates = (coordinatesObj, factor = 100) => {
    return Object.fromEntries(Object.entries(coordinatesObj).map(([key, value]) => [
        key,
        {
            x: Math.round(value.x * factor),
            y: Math.round(value.y * factor),
        },
    ]));
};
exports.scaleCoordinates = scaleCoordinates;
const HC_KEYBOARD_LAYOUT = {
    '0': { x: 0.95, y: 0.68 },
    '1': { x: 0.05, y: 0.68 },
    '2': { x: 0.15, y: 0.68 },
    '3': { x: 0.25, y: 0.68 },
    '4': { x: 0.35, y: 0.68 },
    '5': { x: 0.45, y: 0.68 },
    '6': { x: 0.55, y: 0.68 },
    '7': { x: 0.65, y: 0.68 },
    '8': { x: 0.75, y: 0.68 },
    '9': { x: 0.85, y: 0.68 },
    '@': { x: 0.85, y: 0.78 },
    '!': { x: 0.65, y: 0.88 },
    'a': { x: 0.1, y: 0.78 },
    'b': { x: 0.6, y: 0.88 },
    'c': { x: 0.4, y: 0.88 },
    'd': { x: 0.3, y: 0.78 },
    'e': { x: 0.25, y: 0.68 },
    'f': { x: 0.4, y: 0.78 },
    'g': { x: 0.5, y: 0.78 },
    'h': { x: 0.6, y: 0.78 },
    'i': { x: 0.75, y: 0.68 },
    'j': { x: 0.7, y: 0.78 },
    'k': { x: 0.8, y: 0.78 },
    'l': { x: 0.9, y: 0.78 },
    'm': { x: 0.8, y: 0.88 },
    'n': { x: 0.7, y: 0.88 },
    'o': { x: 0.85, y: 0.68 },
    'p': { x: 0.95, y: 0.68 },
    'q': { x: 0.05, y: 0.68 },
    'r': { x: 0.35, y: 0.68 },
    's': { x: 0.2, y: 0.78 },
    't': { x: 0.45, y: 0.68 },
    'u': { x: 0.65, y: 0.68 },
    'v': { x: 0.5, y: 0.88 },
    'w': { x: 0.15, y: 0.68 },
    'x': { x: 0.3, y: 0.88 },
    'y': { x: 0.55, y: 0.68 },
    'z': { x: 0.2, y: 0.88 },
    ' ': { x: 0.55, y: 0.95 },
};
const HC_NUMPAD_LAYOUT = {
    '0': { x: 0.55, y: 0.95 },
    '1': { x: 0.25, y: 0.7 },
    '2': { x: 0.55, y: 0.7 },
    '3': { x: 0.85, y: 0.7 },
    '4': { x: 0.25, y: 0.8 },
    '5': { x: 0.55, y: 0.8 },
    '6': { x: 0.85, y: 0.8 },
    '7': { x: 0.25, y: 0.9 },
    '8': { x: 0.55, y: 0.9 },
    '9': { x: 0.85, y: 0.9 },
};
const HC_COMMON_COORDINATES = {
    KEYBOARD_SWITCH: {
        x: 0.05,
        y: 0.95,
    },
    SHIFT_KEY: {
        x: 0.05,
        y: 0.88,
    },
    RETURN_KEY: {
        x: 0.95,
        y: 0.95,
    },
};
const PANDA_COMMON_COORDINATES = (0, exports.scaleCoordinates)(HC_COMMON_COORDINATES);
const PANDA_NUMPAD_LAYOUT = (0, exports.scaleCoordinates)(HC_NUMPAD_LAYOUT);
exports.COMMON_COORDINATES = config_1.config.boxType === 'PANDA' ? PANDA_COMMON_COORDINATES : HC_COMMON_COORDINATES;
exports.KEYBOARD_LAYOUT = HC_KEYBOARD_LAYOUT;
exports.NUMPAD_LAYOUT = config_1.config.boxType === 'PANDA' ? PANDA_NUMPAD_LAYOUT : HC_NUMPAD_LAYOUT;
//# sourceMappingURL=keyboard.js.map