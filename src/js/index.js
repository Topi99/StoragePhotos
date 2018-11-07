import {MDCTopAppBar} from '@material/top-app-bar/index';
import '../css/index.scss';
import crypto from 'crypto';
import mime from 'mime';

const uploadFileToStorage = (file, type) => {
  let name = `${crypto.randomBytes(20).toString('hex')}`;
  const dbRef = firebase.database().ref('images/'+name);
  let nameWExt = `${name}.${mime.getExtension(type)}`;
  const storageRef = firebase.storage().ref().child(`${nameWExt}`);

  storageRef.put(file).then(snapshot => {
    console.log('Uploaded file');
    alert('Uploaded file');

    if(type === 'image/jpeg' || type === 'image/png') {
      dbRef.set({
        original: `original_${nameWExt}`,
        md: `md_${nameWExt}`,
        sm: `sm_${nameWExt}`,
        xs: `xs_${nameWExt}`,
      });
    } else if (type === 'video/mp4') {
      dbRef.set({
        original: `original_${nameWExt}`,
        md: `md_${name}.png`,
      });
    }
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
    mediaType: Camera.MediaType.ALLMEDIA,
    allowEdit: true,
    correctOrientation: true  //Corrects Android orientation quirks
  }
  return options;
}

const getFile = imgUri => {
  // let myFileEntry;
  window.resolveLocalFileSystemURL(imgUri, function success(fileEntry) {
    console.log(fileEntry.fullPath);
    // let type = getMimeType(fileEntry.fullPath);
    let type = mime.getType(fileEntry.fullPath);
    fileEntry.file(file => {
      console.log(`From getFile(): ${file}`);
      let reader = new FileReader();
      reader.onloadend = () => {
        let blob = new Blob([new Uint8Array(reader.result)], { type: type });   
        uploadFileToStorage(blob, type);
      }
      reader.readAsArrayBuffer(file);
    }, error => {console.log(error)});
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

const openGalleryEvent = async () => {
  const srcType = Camera.PictureSourceType.SAVEDPHOTOALBUM;
  const options = setOptions(srcType);
  
  navigator.camera.getPicture(imageUri => {
    console.log(imageUri);
    const uri = `file://${imageUri}`;
    resolveFile(uri);
  }, error => {
    console.debug("Unable to obtain picture: " + error, "app");
  }, options);

}

const resolveFile = async imageUri => {
  getFile(imageUri);
  // let file = await getFile(fileEntry);
  // console.log(`From the file object ${file.name}`);
  // loadXHR(imageUri).then((blob) => {
  //   uploadFileToStorage(blob);
  // })
}

var app = {
  initialize: function() {
    document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
  },

  onDeviceReady: function() {
    this.receivedEvent('deviceready');
  },
  
  receivedEvent: async function(id) {
    const topAppBarElement = document.querySelector('.mdc-top-app-bar');
    const topAppBar = new MDCTopAppBar(topAppBarElement);
    const openGalleryBtn = document.querySelector('#open-gallery');
    
    openGalleryBtn.addEventListener('click', () => {
      openGalleryEvent();
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