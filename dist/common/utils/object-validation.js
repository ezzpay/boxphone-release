"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateObjectResult = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const validateObjectResult = async (DtoClass, payload) => {
    const instance = (0, class_transformer_1.plainToInstance)(DtoClass, payload, {
        enableImplicitConversion: true,
    });
    const errors = await (0, class_validator_1.validate)(instance, {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        validationError: { target: false, value: false },
    });
    return { ok: errors.length === 0, instance, errors };
};
exports.validateObjectResult = validateObjectResult;
//# sourceMappingURL=object-validation.js.map