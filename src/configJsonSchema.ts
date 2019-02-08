export default {
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
