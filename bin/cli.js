#!/usr/bin/env node

const http = require("http");
const fs = require("fs");
const path = require("path");

const enterprisePrefix = `/enterprises/{enterpriseId}`;
const projectPrefix = enterprisePrefix + `/projects/{projectId}`;

let fileStr = `/*
 * This file was generated by npm script
 * NEVER MODIFY THIS BY HAND.
 * Go to README.md#swagger-api for more information
 */

import send from "@dc/request"
`;

const configFilePath = path.resolve(__dirname, "./ops.config.js");

if (!configFilePath) {
  console.log(`
  Cannot find ops.config.js at project root.
  Reference: rdk.decobim.com/sapi-cli
  `);
  process.exit(1);
}

const configs = require(configFilePath).swagger;

let count = 0;

configs.forEach(config => {
  parser(config).then(_ => {
    count += 1;
    if (count === configs.length) {
      fs.writeFileSync(configs.dist, fileStr, "utf8");
    }
  });
});

function parser(config) {
  return new Promise((resolve, reject) => {
    http.get(config.swaggerJSON, function(res) {
      res.setEncoding("utf8");

      let swaggerJSONStr = "";
      res.on("data", str => (swaggerJSONStr += str));

      res.on("end", function() {
        const infoObj = JSON.parse(swaggerJSONStr);

        Object.keys(infoObj.paths).forEach(path => {
          Object.keys(infoObj.paths[path]).forEach(type => {
            const pathWithPrefix = config.prefix + path;

            const query = {};
            const body = {};
            const data = [type, pathWithPrefix, query, body];

            const currentRequestObject = infoObj.paths[path][type];

            (currentRequestObject.parameters || []).forEach(param => {
              if (param.in === "query") {
                query[param.name] = param.required;
              } else if (param.in === "body") {
                if (param.schema && param.schema.$ref) {
                  const name = param.schema.$ref.replace("#/definitions/", "");
                  Object.keys(infoObj.definitions[name].properties).forEach(
                    property => {
                      body[property] =
                        infoObj.definitions[name].properties[property].type;
                    }
                  );
                } else if (param.schema && param.schema.type === "array") {
                  body.isArray = true;
                  body.key = param.name;
                }
              }
            });

            fileStr += getCode(
              type,
              currentRequestObject.description,
              generateRequestIdFromPath(type, path, config.namespace),
              data
            );
          });
        });

        resolve();
      });
    });
  });
}

function getCode(type, description, variableName, data) {
  return `
// ${type} ${description || ""}
export const ${variableName} = (params) => send(${JSON.stringify(
    data
  )},params)`;
}

const isProjectPath = path => path.startsWith(projectPrefix);
const isEnterprisePath = path => path.startsWith(enterprisePrefix);

function generateRequestIdFromPath(method, path, namespace) {
  let mainQueue = namespace ? [namespace] : [];
  let paramQueue = [];

  mainQueue.push(method);

  if (isProjectPath(path)) {
    mainQueue.push("project");
    path = path.replace(projectPrefix, "");
  } else if (isEnterprisePath(path)) {
    mainQueue.push("enterprise");
    path = path.replace(enterprisePrefix, "");
  }

  const pathQueue = path.split("/");

  pathQueue.forEach((currentParamater, index) => {
    if (/^{\w+}$/.test(currentParamater)) {
      // current is paramater;
      currentParamater = currentParamater.match(/{(\w+)}/)[1].replace("Id", "");
      paramQueue.push(currentParamater);

      if (currentParamater !== "mobile") {
        pathQueue[index - 1] = null;
      }

      pathQueue[index] = null;
    }
  });

  pathQueue.filter(path => !!path);

  mainQueue = mainQueue.concat(pathQueue);

  if (paramQueue.length) {
    mainQueue = mainQueue.concat(["With"], paramQueue);
  }

  const variableName = mainQueue.reduce((result, element) => {
    if (!element) return result;

    return result + toBigCamel(element);
  });

  return variableName;
}

function toBigCamel(str) {
  return (
    str.charAt(0).toUpperCase() +
    str.slice(1).replace(/-\w/g, match => match.charAt(1).toUpperCase())
  );
}