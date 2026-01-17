"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeBankAccountName = exports.removeVietnameseTones = void 0;
const removeVietnameseTones = (input) => {
    if (!input) {
        return '';
    }
    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
};
exports.removeVietnameseTones = removeVietnameseTones;
const normalizeBankAccountName = (name) => {
    if (!name) {
        return '';
    }
    const transformed = (0, exports.removeVietnameseTones)(name);
    return transformed.trim().replace(/ /g, '').toLocaleUpperCase();
};
exports.normalizeBankAccountName = normalizeBankAccountName;
//# sourceMappingURL=string.js.map