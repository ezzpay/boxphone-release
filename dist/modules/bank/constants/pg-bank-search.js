"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PG_BANK_SEARCH_UI_COORDINATES = exports.HC_PG_BANK_SEARCH_UI_COORDINATES = void 0;
const config_1 = require("../../../common/constants/config");
const scaleBankSearchCoordinates = (coordinates, factor = 100) => {
    return Object.fromEntries(Object.entries(coordinates).map(([key, value]) => [
        key,
        {
            ...value,
            coordinates: {
                x: Math.round(value.coordinates.x * factor),
                y: Math.round(value.coordinates.y * factor),
            },
        },
    ]));
};
exports.HC_PG_BANK_SEARCH_UI_COORDINATES = {
    VIETCOMBANK: {
        searchValue: 'VIETCOMBANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    AGRIBANK: {
        searchValue: 'AGRIBANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    BIDV: {
        searchValue: 'BIDV',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    SACOMBANK: {
        searchValue: 'SACOMBANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    TECHCOMBANK: {
        searchValue: 'TECHCOMBANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    TPBANK: {
        searchValue: 'TPBANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    HDBank: {
        searchValue: 'HDBank',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    VPBANK: {
        searchValue: 'VPBANK',
        coordinates: {
            x: 0.5,
            y: 0.78,
        },
    },
    MBBANK: {
        searchValue: 'QUAN DOI',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    MSB: {
        searchValue: 'MSB',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    LPBANK: {
        searchValue: 'LPBANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    ACB: {
        searchValue: 'ACB',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    ABBANK: {
        searchValue: 'ABANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    NCB: {
        searchValue: 'NCB',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    EXIMBANK: {
        searchValue: 'EXIMBANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    SEABANK: {
        searchValue: 'SEABANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    SCB: {
        searchValue: 'SCB',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    PVCOMBANK: {
        searchValue: 'PVCOMBANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    KIENLONGBANK: {
        searchValue: 'KIENLONG',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    BVBANK: {
        searchValue: 'BVBANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    VIETINBANK: {
        searchValue: 'VIETINBANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    OCB: {
        searchValue: 'OCB',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    VIETBANK: {
        searchValue: 'VIETBANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    SHB: {
        searchValue: 'SHB',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    NAMABANK: {
        searchValue: 'NAM A BANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    SHINHANBANKVIETNAM: {
        searchValue: 'SHINHAN BANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    CIMB: {
        searchValue: 'CIMB',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    SAIGONBANK: {
        searchValue: 'SAIGONBANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    BACABANK: {
        searchValue: 'BAC',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    VIETABANK: {
        searchValue: 'VIET A BANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    GPBANK: {
        searchValue: 'GPBANK',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    HSBC: {
        searchValue: 'HSBC',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    VRB: {
        searchValue: 'VRB',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    },
    VIB: {
        searchValue: 'VIB',
        coordinates: {
            x: 0.5,
            y: 0.58,
        },
    }
};
const PANDA_PG_BANK_SEARCH_UI_COORDINATES = scaleBankSearchCoordinates(exports.HC_PG_BANK_SEARCH_UI_COORDINATES, 100);
exports.PG_BANK_SEARCH_UI_COORDINATES = config_1.config.boxType === 'PANDA' ? PANDA_PG_BANK_SEARCH_UI_COORDINATES : exports.HC_PG_BANK_SEARCH_UI_COORDINATES;
//# sourceMappingURL=pg-bank-search.js.map