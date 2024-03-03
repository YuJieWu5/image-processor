const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path'); // Make sure to include the 'path' module
const sharp = require('sharp');
// Define the path to your .proto file
const PROTO_PATH = path.join(__dirname, 'image_operation.proto');

// init express for swagger api
const express = require('express');
const swaggerUI = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();

// Serve Swagger documentation
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// Your API routes go here

app.listen(8081, () => {
console.log('Server is running on port 8081');
});

// api definition

// Load the protobuf definitions
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

// Load the package as defined in your .proto file
const imageProto = grpc.loadPackageDefinition(packageDefinition).image_server;

function processImage(image, rotate, width, height, grayscale, fliphorizontal, flipvertical) {
    sharp.cache(false);

    let transformer = sharp(image).withMetadata();

    if (rotate) {
        var degree = 0;
        rotate.forEach(angle => {
            // transformer = transformer.rotate(parseInt(angle));
            degree = degree + parseInt(angle);
        });
        transformer = transformer.rotate(parseInt(degree));
    }

    if (width && height) {
        transformer = transformer.resize(parseInt(width), parseInt(height));
    }

    if (grayscale) {
        transformer = transformer.greyscale();
    }

    if(fliphorizontal){
        transformer = transformer.flop();
    }

    if(flipvertical){
        transformer = transformer.flip();
    }

    // Return the transformer promise, which will resolve with the processed image buffer
    return transformer.toBuffer();

    // sharp.cache(false);
    // const sharpStream = sharp({
    //     failOnError: true
    // });
    // const transformer = sharp(image)
    //     .pipe(sharpStream);
    // if (rotate) {
    //     for(var i=0; i<rotate.length; i++){
    //         console.log(rotate[i]);
    //         transformer.pipe(sharpStream.rotate(parseInt(rotate[i])));
    //     }
    // }
    // if (width && height) {
    //     transformer.pipe(sharpStream.resize(parseInt(width), parseInt(height)));
    // }
    // if (grayscale) {
    //     transformer.pipe(sharpStream.greyscale());
    // }
    // return transformer.pipe(sharpStream);
}

async function generateThumbnail(image) {
    // Disable sharp's caching to prevent memory issues in long-running applications.
    sharp.cache(false);

    try {
        // Use sharp to resize and convert the image to a thumbnail.
        const buffer = await sharp(image)
            .resize(200, 200, {
                fit: 'contain', // Ensure the image is resized to fit within the specified dimensions.
                background: { r: 255, g: 255, b: 255, alpha: 1 } // Set the background to white, fully opaque.
            })
            .toBuffer(); // Convert the processed image to a Buffer.

        // Convert Buffer to Uint8Array
        return new Uint8Array(buffer);
    } catch (err) {
        console.error('Error generating thumbnail:', err);
        throw err; // Rethrow the error for further handling.
    }
}

const getImageOperation = async (call, callback) => {
    // Extract the request data
    const {image, rotate, width, height, grayscale, thumbnails, fliphorizontal, flipvertical} = call.request;
    // console.log(image)
    try {
        // Process the image based on the request parameters
        // For example, rotate, resize, apply grayscale, etc.
        // This is where you'd include your image processing logic
        const processedImage = await processImage(image, rotate, width, height, grayscale, fliphorizontal, flipvertical); // Assuming processImage is synchronous or has been awaited if asynchronous

        let thumbnail = null;
        if (thumbnails) {
            thumbnail = await generateThumbnail(processedImage); // Wait for the thumbnail generation
        }
        console.log("thumbnail: ",thumbnail);

        // If processing is successful, construct a success response
        if (thumbnail) {
            console.log('success with thumbnail')
            // If a thumbnail was generated, use the success_with_thumbnail response
            callback(null, {

                success_with_thumbnail: {
                    code: 200, // Success code
                    message: "Image processed successfully with thumbnail.",
                    image: processedImage,
                    thumbnail_image: thumbnail
                }

            });
        } else {
            console.log('successful without thumbnail')
            // If no thumbnail was requested or generated, use the simple success response
            callback(null, {
                success: {
                    code: 200,
                    message: "Image processed successfully.",
                    image: processedImage
                }
            });
        }
    } catch (error) {
        console.log('error')
        // If there's an error during processing, construct a failure response
        callback(null, {
            fail: {
                code: error.code || 422, // Internal Server Error or a specific error code
                message: error.message || "Failed to process the image."
            }
        });
    }
};


const main = () => {
    const server = new grpc.Server({
        'grpc.max_receive_message_length': 10 * 1024 * 1024, // 10 MB
        'grpc.max_send_message_length': 10 * 1024 * 1024, // 10 MB
    });

    // Add the ImageOperationService to the server
    server.addService(imageProto.ImageOperationService.service, {
        GetImageOperation: getImageOperation, // Method names should match those defined in your .proto file
    });

    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || '50051';
    const bindAddress = `${host}:${port}`;

    // Start the server
    server.bindAsync(bindAddress, grpc.ServerCredentials.createInsecure(), (error, port) => {
        if (error) {
            console.error(`Server failed to bind: ${error.message}`);
            return;
        }
        server.start();
        console.log(`Server started, listening on ${bindAddress}`);
    });
};

main();
