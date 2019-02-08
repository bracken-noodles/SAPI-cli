"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  type: "object",
  items: {
    proxy: {
      type: "array",
      items: {
        type: "object",
        properties: {
          prefix: "string",
          namespace: "string",
          swaggerJSON: "string"
        }
      }
    },
    dist: "string"
  },
  required: ["proxy", "dist"]
};
exports.default = _default;