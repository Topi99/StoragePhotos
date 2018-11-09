import {MDCTopAppBar} from '@material/top-app-bar/index';
import {MDCRipple} from '@material/ripple';
import {MDCLinearProgressFoundation} from '@material/linear-progress';
import '../css/index.scss';
import crypto from 'crypto';
import mime from 'mime';

const uploadFileToStorage = async (file, type) => {
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
        id: name,
        type: type
      });
    } else if (type === 'video/mp4') {
      dbRef.set({
        original: `original_${nameWExt}`,
        md: `md_${name}.png`,
        id: name,
        type: type
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

const getImageElement = (src, type) => {
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

  if(type === 'video/mp4') {
    span.setAttribute('class', 'material-icons type-video');
    span.innerText = 'play_circle_filled';
    li.append(span);
  }

  return li;
}

const openGalleryEvent = async () => {
  const srcType = Camera.PictureSourceType.SAVEDPHOTOALBUM;
  const options = setOptions(srcType);
  
  navigator.camera.getPicture(imageUri => {
    console.log(imageUri);
    if(!imageUri.startsWith('file://')) {
      const uri = `file://${imageUri}`;
      resolveFile(uri);
    } else {
      resolveFile(imageUri);
    }
  }, error => {
    console.debug("Unable to obtain picture: " + error, "app");
  }, options);
}

const openCameraEvent = async () => {
  const srcType = Camera.PictureSourceType.CAMERA;
  const options = setOptions(srcType);
  
  navigator.camera.getPicture(imageUri => {
    console.log(imageUri);
    const uri = `${imageUri}`;
    resolveFile(uri);
  }, error => {
    console.debug("Unable to obtain picture: " + error, "app");
  }, options);
}

const resolveFile = async imageUri => {
  getFile(imageUri);
}

const openElement = (original, type) => {
  // alert(original);
  const storageRef = firebase.storage().ref();
  storageRef.child(original).getDownloadURL().then(url => {
    let player, img, video, src;
  
    if(type === 'image/jpeg' || type === 'image/png') {
      player = document.querySelector('.image-player');
      img = player.childNodes[3];
      img.setAttribute('src', url);
      // console.log(player.childNodes);
    } else if (type === 'video/mp4') {
      player = document.querySelector('.video-player');
      video = player.childNodes[3];
      src = video.childNodes[1];
      src.setAttribute('src', url);
      video.load();
      video.play();
    }
  
    player.classList.toggle('hidden');
    player.classList.toggle('active');


  });
  
}

var app = {
  initialize: function() {
    document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
  },

  onDeviceReady: function() {
    this.receivedEvent('deviceready');
  },
  
  receivedEvent: async function(id) {
    const fabRipple = new MDCRipple(document.querySelector('.mdc-fab'));
    const topAppBarElement = document.querySelector('.mdc-top-app-bar');
    // const progressBar = new MDCLinearProgressFoundation(document.querySelector('.mdc-linear-progress'));
    const topAppBar = new MDCTopAppBar(topAppBarElement);
    const openGalleryBtn = document.querySelector('#open-gallery');
    const openCameraBtn = document.querySelector('#open-camera');
    const player = document.querySelector('.image-player');
    const videoPlayer = document.querySelector('.video-player');
    const btnCloseImage = document.querySelector('.image-player .close');
    const btnCloseVideo = document.querySelector('.video-player .close');
    
    // progressBar.setProgress(0.5);
    // progressBar.open();
    // progressBar.setBuffer(0.5);
    // progressBar.close();

    document.querySelector('#open-fabs').addEventListener('click', () => {
      document.querySelector('.fab-children').classList.toggle('active');
      document.querySelector('close').classList.toggle('hidden');
      document.querySelector('add').classList.toggle('hidden');
    });

    openGalleryBtn.addEventListener('click', () => {
      openGalleryEvent();
    });

    openCameraBtn.addEventListener('click', () => {
      openCameraEvent();
    });

    btnCloseImage.addEventListener('click', () => {
      player.classList.toggle('hidden');
      player.classList.toggle('active');
    });

    btnCloseVideo.addEventListener('click', () => {
      videoPlayer.classList.toggle('hidden');
      videoPlayer.classList.toggle('active');
      videoPlayer.childNodes[3].pause();
    });

    const dbRef = firebase.database().ref('images/');
    const storageRef = firebase.storage().ref();
    const imageList = document.querySelector('#image-list');
    let element;
    // let md_url;

    // Leemos cada vez que se añada un nuevo hijo
    dbRef.on('child_added', data => {
      storageRef.child(data.val().md).getDownloadURL().then(url => {
        element = getImageElement(url, data.val().type);
        element.setAttribute('id', data.val().id);
        element.dataset.original = data.val().original;
        element.dataset.type = data.val().type;
        element.addEventListener('click', e => {
          openElement(e.target.parentNode.dataset.original, e.target.parentNode.dataset.type);
        });
        imageList.insertBefore(element, imageList.firstChild);
      });
    });
  },
}

app.initialize();