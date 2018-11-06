import {MDCTopAppBar} from '@material/top-app-bar/index';
import '../css/index.scss';
import crypto from 'crypto';

const uploadFileToStorage = file => {
  let name = `${crypto.randomBytes(20).toString('hex')}`;
  const storageRef = firebase.storage().ref().child(`${name}.jpg`);
  const dbRef = firebase.database().ref('images/'+name);

  storageRef.put(file).then(snapshot => {
    console.log('Uploaded file');
    alert('Uploaded file');

    dbRef.set({
      original: `original_${name}.jpg`,
      md: `md_${name}.jpg`,
      sm: `sm_${name}.jpg`,
      xs: `xs_${name}.jpg`,
    });
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

const getImageElement = (src) => {
  let li = document.createElement('li');
  let img = document.createElement('img');
  let div = document.createElement('div');
  let span = document.createElement('span');

  li.setAttribute('class', 'mdc-image-list__item');
  img.setAttribute('class', 'mdc-image-list__image');
  img.setAttribute('src', src);
  div.setAttribute('class', 'mdc-image-list__supporting');
  span.setAttribute('class', 'mdc-image-list__label');
  span.innerHTML = 'Text Label';

  div.appendChild(span);
  li.appendChild(img);
  li.appendChild(img);

  return li;
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
        })
      }, error => {
          console.debug("Unable to obtain picture: " + error, "app");
      }, options);
    });

    const dbRef = firebase.database().ref('images/');
    const storageRef = firebase.storage().ref();
    const imageList = document.querySelector('#image-list');
    let element;
    // let md_url;

    // Leemos cada vez que se añada un nuevo hijo
    dbRef.on('child_added', data => {
      console.log(`Child added: \n${data.val().md}`);

      storageRef.child(data.val().md).getDownloadURL().then(url => {
        console.log(url);
        element = getImageElement(url);
        imageList.insertBefore(element, imageList.firstChild);
      });
    });
  },
}

app.initialize();