import "./App.css";

import { faRotateLeft, faRotateRight } from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ImageOperation } from "./image_operation_pb";
import { ImageOperationServiceClient } from "./image_operation_grpc_web_pb";
import { useState } from "react";

function App() {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgBuffer, setImgBuffer] = useState(null);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [thumbnail, setThumbnail] = useState(false);
  const [grayscale, setGrayscale] = useState(false);
  const [right, setRight] = useState(0);
  const [left, setLeft] = useState(0);
  const [width, setWidth] = useState(null);
  const [height, setHeight] = useState(null);
  const [imageErrorMsg, setImageErrorMsg] = useState(null);
  const [widthErrorMsg, setWidthErrorMsg] = useState(null);
  const [heightErrorMsg, setHeightErrorMsg] = useState(null);
  const [rotateErrorMsg, setRotateErrorMsg] = useState(null);
  const [rotate, setRotate] = useState([]);
  const [rotateDegree, setRotateDegree] = useState(0);
  
  const client = new ImageOperationServiceClient(
    "http://localhost:8080",
    null,
    null
  );

  const handleImage = (event) => {
    const file = event.target.files[0];

    if (!file) {
      setImageErrorMsg("Invalid Image Data");
      return;
    }

    const readerArrayBuffer = new FileReader();
    readerArrayBuffer.onload = (e) => {
      const buffer = e.target.result;
      setImgBuffer(buffer);
    };
    readerArrayBuffer.readAsArrayBuffer(file);

    const readerDataUrl = new FileReader();
    readerDataUrl.onload = (e) => {
      setImgSrc(e.target.result);
    };
    readerDataUrl.readAsDataURL(file);
    resetResult();
    setImageErrorMsg(null);
  };

  const handleFlip = (value) => {
    if (value === "horizontal") {
      setFlipHorizontal((prevState) => !prevState);
    } else {
      setFlipVertical((prevState) => !prevState);
    }
  };

  const handleRotate = (value) => {
    if(value===90){
      setRight(right+1);
    }else{
      setLeft(left+1);
    }
    setRotate([...rotate, value]);
  };

  const handleRotateDegree = (e) =>{
    const reg = /^[-0-9\b]+$/;
    if(reg.test(e.target.value)){
      setRotateDegree(e.target.value);
      setRotateErrorMsg(null);
    }else if(e.target.value==="")
      setRotateErrorMsg(null);
    else
      setRotateErrorMsg('Rotate degree must be number');
  }

  const handleWidthChange = (e) => {
    const reg = /^[0-9\b]+$/;
    if(reg.test(e.target.value)){
      setWidth(e.target.value);
      setWidthErrorMsg(null);
    }else if(e.target.value==="")
      setWidthErrorMsg(null);
    else
      setWidthErrorMsg('Width must be number');
  };

  const handleHeightChange = (e) => {
    const reg = /^[0-9\b]+$/;
    if(reg.test(e.target.value)){
      setHeight(e.target.value);
      setHeightErrorMsg(null);
    }else if(e.target.value==="")
      setHeightErrorMsg(null);
    else
      setHeightErrorMsg('Height must be number');
  };

  const handleThumbnailChange = () => {
    setThumbnail((prevState) => !prevState);
  };

  const handleGrayScaleChange = () => {
    setGrayscale((prevState) => !prevState);
  };

  const generateResult = async () => {
    var final_rotate = rotate;
    if(rotateDegree!=0 && rotateDegree!=''){
      console.log(rotateDegree);
      final_rotate.push(rotateDegree);
    }

    if(imgBuffer==null){
      setImageErrorMsg("Invalid Image Data");
      return;
    }      
      
    try {
      const request = new ImageOperation();
      request.setImage(new Uint8Array(imgBuffer));
      request.setRotateList(final_rotate);
      request.setWidth(width);
      request.setHeight(height);
      request.setGrayscale(grayscale);
      request.setThumbnails(thumbnail);
      request.setFliphorizontal(flipHorizontal);
      request.setFlipvertical(flipVertical);
      client.getImageOperation(request, {}, function (err, response) {
        if (err) {
          console.error("Error:", err);
        } else {
          let content;
          let img;
          let img_thumbnail;
          let blob;
          let url;
          
          //Generate Result image section title
          content = response.array[1];
          let text = document.createElement("h3");
          text.textContent = "Result Image"
          document.getElementById("result").appendChild(text);

          //request.array[5] refers to thumbnail
          if (request.array[5] === true) {
            //load general size
            blob = new Blob([content[2]], { type: "image/png" });
            url = URL.createObjectURL(blob);
            img = document.createElement("img");
            img.src = url;
            document.getElementById("result").appendChild(img);
            //load thumbnail image
            blob = new Blob([content[3]], { type: "image/png" });
            url = URL.createObjectURL(blob);
            img_thumbnail = document.createElement("img");
            img_thumbnail.src = url;
            document.getElementById("result").appendChild(img_thumbnail);
          } else {
            // if there is no thumbnail in request, content is response.array[0]
            content = response.array[0][2];
            blob = new Blob([content], { type: "image/png" });
            url = URL.createObjectURL(blob);
            img = document.createElement("img");
            img.src = url;
            document.getElementById("result").appendChild(img);
          }
        }
        resetState();
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const resetState = () =>{
    setFlipHorizontal(false);
    setFlipVertical(false);
    setThumbnail(false);
    setGrayscale(false);
    setWidth(null);
    setHeight(null);
    setImageErrorMsg(null);
    setWidthErrorMsg(null);
    setHeightErrorMsg(null);
    setRotateErrorMsg(null);
    setRight(0);
    setLeft(0);
    setRotate([]);
    document.getElementById('rotateDegree').value = "";
    document.getElementById('width').value = "";
    document.getElementById('height').value = "";
  }

  const resetResult = () =>{
    const resultElement = document.getElementById("result");
    while (resultElement.firstChild) {
      resultElement.removeChild(resultElement.firstChild);
    }
  }

  return (
    <>
      <label className="w-500 flex">
        <input
          className="hidden"
          type="file"
          accept="image/*"
          onChange={handleImage}
        />
        <div className=" ml-5 mt-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">
          Select Image
        </div>
      </label>
      {imageErrorMsg!=null &&<label className="error-txt">{imageErrorMsg}</label>}
      <div className="row ml-5">
        <div className="col-md-7">
          {imgSrc != null && (
            <>
              <h3>Original Image</h3>
              <img src={imgSrc} alt="Uploaded" style={{ maxWidth: "500px" }} />
            </>
          )}
          <div id="result" className="overflow-y" style={{ maxWidth: "500px" }}>
            {/* <h1>Processed Images</h1> */}
          </div>
        </div>
        <div className="col-md-5">
          <div>
            <label className="font-bold">Flip Horizontal:</label>
            <label className="inline-flex items-center cursor-pointer ml-4">
              <input
                onChange={() => handleFlip("horizontal")}
                type="checkbox"
                checked={flipHorizontal}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div>
            <label className="font-bold">Flip Vertical:</label>
            <label className="inline-flex items-center cursor-pointer ml-4">
              <input
                onChange={() => handleFlip("vertical")}
                type="checkbox"
                checked={flipVertical}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="mt-5">
            <label className="font-bold">Rotate:</label>
            <div className="ml-3 inline-flex">
              <button
                onClick={() => handleRotate(-90)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"
              >
                RotateLeft <FontAwesomeIcon icon={faRotateLeft} />{left}
              </button>
              <button
                onClick={() => handleRotate(90)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r"
              >
                RotateRight <FontAwesomeIcon icon={faRotateRight} />{right}
              </button>
            </div>
            <div className="grid grid-flow-row auto-rows-max">
              <label className="font-bold">Rotate with degree:</label>
              <input
                id="rotateDegree"
                type="text"
                onChange={handleRotateDegree}
                className="block w-20 p-3 ps-5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
              {rotateErrorMsg!=null &&<label className="error-txt">{rotateErrorMsg}</label>}
            </div>
          </div>
          <div className="mt-5">
            <label className="font-bold">Resize:</label>
            <div className="row">
              <div className="col-md-6">
                  <label>Width:</label>
                  <input
                    id="width"
                    onChange={handleWidthChange}
                    type="text"
                    className="block w-30 p-3 ps-5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                  {widthErrorMsg!=null &&<label className="error-txt">{widthErrorMsg}</label>}
              </div>
              <div className="col-md-6">
                <label>Height:</label>
                <input
                  id="height"
                  onChange={handleHeightChange}
                  type="text"
                  className="block w-30 p-3 ps-5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
                {heightErrorMsg!=null &&<label className="error-txt">{heightErrorMsg}</label>}
              </div>
            </div>
          </div>
          <div className="mt-5">
            <label className="font-bold">Grayscale:</label>
            <label className="inline-flex items-center cursor-pointer ml-4">
              <input
                onChange={handleGrayScaleChange}
                type="checkbox"
                checked={grayscale}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="mt-5">
            <label className="font-bold">Thumbnail:</label>
            <label className="inline-flex items-center cursor-pointer ml-4">
              <input
                onChange={handleThumbnailChange}
                type="checkbox"
                checked={thumbnail}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div>
            <button
              onClick={generateResult}
              className="mt-10 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              GENERATE
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
