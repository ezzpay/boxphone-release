"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMimeType = exports.BILL_IMAGE_EXTENSIONS = void 0;
exports.BILL_IMAGE_EXTENSIONS = ['.png'];
const getMimeType = (ext) => {
    const mimeTypes = {
        '.png': 'image/png'
    };
    return mimeTypes[ext.toLowerCase()] || 'image/png';
};
exports.getMimeType = getMimeType;
//# sourceMappingURL=bill.js.map