const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
    "openapi": "3.0.0",
    "info": {
      "title": "Image Processor",
      "version": "1.0.0",
      "description": "The ImageOperation documentation includes the request/response body that clients will use, and implements gRPC API design. I use JSON-RPC to simulate the protocol message buffer in the document."
    },
    "servers": [
      {
        "url": "http://localhost:50051",
        "description": "Local server"
      }
    ],
    "paths": {
      "/ImageOperation": {
        "post": {
          "summary": "send image data and operations",
          "description": "Implement operations on image",
          "requestBody":{
            "content":{
              "application/json":{
                "schema":{
                  "$ref":"#/components/schemas/ImageOperation"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "The request was successfully processed below using the example response of having a thumbnail operation. To see the response without thumbnail operation, please take a look at the schema \"RequestSuccessful.\"",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": '#/components/schemas/RequestSuccessWithThumbnail'
                  }
                }
              }
            },
            "422": {
              "description": "Failed to process the image",
              "content":{
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/RequestFail"
                  }
                }
              }
            }
          },
        }
      },
    },
    "components": {
      "schemas": {
        "ImageOperation": {
          "type": "object",
          "properties": {
            "image": {
              "type": "number"
            },
            "rotate": {
              "type": "integer"
            },
            "resize": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "width": {
                    "type": "integer"
                  },
                  "height": {
                    "type": "integer"
                  }
                }
              }
            },
            "grayscale": {
              "type": "boolean"
            },
            "fliphorizontal": {
              "type": "boolean"
            },
            "flipvertical": {
              "type": "boolean"
            },
            "thumbnail": {
              "type": "boolean"
            }
          }
        },
        "RequestSuccessful": {
          "type": "object",
          "properties": {
            "code": {
              "type": "integer",
              "format": "int32"
            },
            "message": {
              "type": "string"
            },
            "image": {
              "type": "number"
            }
          }
        },
        "RequestSuccessWithThumbnail": {
          "type": "object",
          "properties": {
            "code": {
              "type": "integer",
              "format": "int32"
            },
            "message": {
              "type": "string"
            },
            "image": {
              "type": "number"
            },
            "thumbnail_image": {
              "type": "number"
            }
          }
        },
        "RequestFail": {
          "type": "object",
          "properties": {
            "code": {
              "type": "integer",
              "format": "int32"
            },
            "message": {
              "type": "string"
            }
          }
        }
      }
    },
  }
  

const options = {
swaggerDefinition,
apis: ['./image_operation.proto'], 

};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;