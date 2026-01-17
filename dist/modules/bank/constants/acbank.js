"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACB_UI_COORDINATES = void 0;
const config_1 = require("../../../common/constants/config");
const keyboard_1 = require("../../../common/constants/keyboard");
const HC_ACB_UI_COORDINATES = {
    LOGIN_BUTTON: {
        x: 0.5,
        y: 0.8,
    },
    LOGIN_BUTTON_API: {
        x: 0.5,
        y: 0.62,
    },
    PASSWORD_FIELD: {
        x: 0.5,
        y: 0.45,
    },
};
const PANDA_ACB_UI_COORDINATES = (0, keyboard_1.scaleCoordinates)(HC_ACB_UI_COORDINATES);
exports.ACB_UI_COORDINATES = config_1.config.boxType === 'PANDA' ? PANDA_ACB_UI_COORDINATES : HC_ACB_UI_COORDINATES;
//# sourceMappingURL=acbank.js.map