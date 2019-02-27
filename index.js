/**
Config for dashboard
@author:
@version: 1.0
 **/
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

const errorHandlerModule = require("./components/error-handler.js"); 
const responseObj = require("./components/response.js");
const configObj = require("./components/config.js"); 
const logger = require("./components/logger.js"); 

module.exports.handler = (event, context, cb) => {

  const errorHandler = errorHandlerModule();
  const config = configObj.getConfig(event, context);
  logger.init(event, context);

  try {
    if (event && event.method && event.method === 'GET') {
      if (config.store && config.store.s3) {
         s3.getObject(config.store.s3).promise()
         .then( (result) => {
            logger.info(`S3 data is ${result.Body.toString()}`);
            return cb(null, JSON.parse(new Buffer(result.Body).toString("utf8")).config);
         })
         .catch(function(err) {
          logger.error(`Failed while getting config data ${err}`);
          return cb(JSON.stringify(errorHandler.throwInternalServerError("Error while retrieving config data.")));
        });
      }
    }

		if (event && event.method && event.method === 'POST') {
      if (event.body && event.method.body.config) {
        let uploadObject = config.store.s3;
        uploadObject.Body = event.method.body.config;
        s3.upload(uploadObject).promise()
        .then( (result) => {
          return cb(null, responseObj({ message: "Processed message successfully"} , event.body));
        })
        .catch(function(err) {
          logger.error(`Failed while updating config data ${err}`);
          return cb(JSON.stringify(errorHandler.throwInternalServerError("Error while updating config data.")));
        });
      }
    }
  } catch (e) {
    logger.error(e);
    return cb(JSON.stringify(errorHandler.throwInternalServerError("Error occurred")));
  }
};
