"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setResponseObject = (req, res, next) => {
    req.responseObject = res;
    next();
};
exports.default = setResponseObject;
//# sourceMappingURL=setResponse.js.map