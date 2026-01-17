"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANALYZE_BILL_ROI = void 0;
const hd_roi_1 = require("./hd-roi");
const pg_roi_1 = require("./pg-roi");
const vcb_roi_1 = require("./vcb-roi");
exports.ANALYZE_BILL_ROI = {
    PGBANK: {
        ROI: pg_roi_1.PG_ROI_EXPECTED.TRANSACTION_SUCCESS,
        expectedTexts: ['chuyển tiền thành công'],
    },
    HDBANK: {
        ROI: hd_roi_1.HD_ROI_EXPECTED.BILL_AREA,
        expectedTexts: ['Kết quả giao dịch'],
    },
    VIETCOMBANK: {
        ROI: vcb_roi_1.VCB_ROI_EXPECTED.TRANSACTION_SUCCESS,
        expectedTexts: ['Giao dịch thành công'],
    },
};
//# sourceMappingURL=analyze-bill.js.map