"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VCB_UI_COORDINATES = void 0;
const config_1 = require("../../../common/constants/config");
const keyboard_1 = require("../../../common/constants/keyboard");
const HC_VCB_UI_COORDINATES = {
    LOGIN_BTN: {
        x: 0.5,
        y: 0.55,
    },
    PASSWORD_FIELD: {
        x: 0.5,
        y: 0.45,
    },
    TRANSFER_BTN: {
        x: 0.7,
        y: 0.7,
    },
    TRANSFER_INTERNAL_BTN: {
        x: 0.2,
        y: 0.2
    },
    TRANSFER_EXTERNAL_BTN: {
        x: 0.4,
        y: 0.2,
    },
    CLOSE_ALLOW_CONTACT_POPUP_BTN: {
        x: 0.3,
        y: 0.6,
    },
    ACCOUNT_NUMBER_INPUT: {
        x: 0.4,
        y: 0.43,
    },
    SELECT_BANK_BTN: {
        x: 0.4,
        y: 0.47,
    },
    SEARCH_BANK_BTN: {
        x: 0.4,
        y: 0.48,
    },
    INTERNAL_AMOUNT_INPUT: {
        x: 0.5,
        y: 0.6,
    },
    HIDE_NUMPAD_BTN: {
        x: 0.05,
        y: 0.4,
    },
    CONTINUE_TRANSFER_BTN: {
        x: 0.6,
        y: 0.92,
    },
    CONTINUE_OTP_VERIFY_BTN: {
        x: 0.5,
        y: 0.68,
    },
    OTP_ENTER_TRANSFER_BTN: {
        x: 0.5,
        y: 0.62,
    },
    BANK_SEARCH_BTN: {
        x: 0.4,
        y: 0.45,
    },
    BANK_SEARCH_INPUT: {
        x: 0.4,
        y: 0.45,
    },
    EXTERNAL_AMOUNT_INPUT: {
        x: 0.3,
        y: 0.37,
    },
    BACK_TO_HOME: {
        x: 0.2,
        y: 0.9,
    },
    QR_CODE_BTN: {
        x: 0.4,
        y: 0.92,
    },
    IMAGE_LIBRARY_BTN: {
        x: 0.4,
        y: 0.92,
    },
    FIRST_IMAGE_BTN: {
        x: 0.3,
        y: 0.3,
    },
    SELECT_IMAGE_QR_CODE_BTN: {
        x: 0.95,
        y: 0.95,
    },
    HOME_ICON: {
        x: 0.93,
        y: 0.07,
    },
};
const PANDA_VCB_UI_COORDINATES = (0, keyboard_1.scaleCoordinates)(HC_VCB_UI_COORDINATES);
exports.VCB_UI_COORDINATES = config_1.config.boxType === 'PANDA' ? PANDA_VCB_UI_COORDINATES : HC_VCB_UI_COORDINATES;
//# sourceMappingURL=vietcombank.js.map