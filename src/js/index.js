import {MDCTopAppBar} from '@material/top-app-bar/index';
import '../css/index.scss';
import crypto from 'crypto';

const uploadFileToStorage = file => {
  let name = `${crypto.randomBytes(20).toString('hex')}`;
  const storageRef = firebase.storage().ref().child(`${name}.jpg`);
  const dbRef = firebase.database().ref(name);

  storageRef.put(file).then(snapshot => {
    console.log('Uploaded file');
    alert('Uploaded file');
  });

  dbRef.child().set({
    original: `original_${name}.jpg`,
    md: `md_${name}.jpg`,
    sm: `sm_${name}.jpg`,
    xs: `xs_${name}.jpg`,
  });
}

const setOptions = srcType => {
  var options = {
    // Some common settings are 20, 50, and 100
    quality: 100,
    destinationType: Camera.DestinationType.FILE_URI,
    // In this app, dynamically set the picture source, Camera or photo gallery
    sourceType: srcType,
    encodingType: Camera.EncodingType.JPEG,
    mediaType: Camera.MediaType.PICTURE,
    allowEdit: true,
    correctOrientation: true  //Corrects Android orientation quirks
  }
  return options;
}

const createNewFileEntry = imgUri => {
  window.resolveLocalFileSystemURL(cordova.file.cacheDirectory, function success(dirEntry) {
    // JPEG file
    dirEntry.getFile("tempFile.jpeg", { create: true, exclusive: false }, function (fileEntry) {
      // Do something with it, like write to it, upload it, etc.
      // writeFile(fileEntry, imgUri);
      console.log("got file: " + fileEntry.fullPath);
      return fileEntry;
      // displayFileData(fileEntry.fullPath, "File copied to");

    }, onErrorCreateFile);

  }, onErrorResolveUrl);
}

function loadXHR(url) {
  return new Promise(function(resolve, reject) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url);
      xhr.responseType = "blob";
      xhr.onerror = function() {reject("Network error.")};
      xhr.onload = function() {
          resolve(xhr.response);
      };
      xhr.send();
    }
    catch(err) {reject(err.message)}
  });
}

var app = {
  initialize: function() {
    document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
  },

  onDeviceReady: function() {
    this.receivedEvent('deviceready');
  },
  
  receivedEvent: function(id) {
    const topAppBarElement = document.querySelector('.mdc-top-app-bar');
    const topAppBar = new MDCTopAppBar(topAppBarElement);
    const openGalleryBtn = document.querySelector('#open-gallery');
    
    openGalleryBtn.addEventListener('click', () => {
      const srcType = Camera.PictureSourceType.SAVEDPHOTOALBUM;
      const options = setOptions(srcType);
      
      navigator.camera.getPicture(imageUri => {
        console.log(`Getting ${imageUri}`);

        loadXHR(imageUri).then((blob) => {
          uploadFileToStorage(blob);
          // console.log(blob);
          // console.log();
        })
      }, error => {
          console.debug("Unable to obtain picture: " + error, "app");
      }, options);
    });
  },
}

app.initialize();