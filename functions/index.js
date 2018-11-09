const functions = require('firebase-functions');
const { Storage } = require('@google-cloud/storage');
const os = require('os');
const path = require('path');
const spawn = require('child-process-promise').spawn;
const crypto = require('crypto');

exports.onFileChange = functions.storage.object().onFinalize(event => {
  const bucket = event.bucket;
  const contentType = event.contentType;
  console.log(contentType);
  const filePath = event.name;

  console.log('File changed, function execution started');

  if(path.basename(filePath).startsWith('thumb_') || path.basename(filePath).startsWith('original_') || path.basename(filePath).startsWith('md_') || path.basename(filePath).startsWith('sm_') || path.basename(filePath).startsWith('xs_')) {
    console.log('We already renamed that file');
    return;
  }

  const storage = new Storage();
  const destBucket = storage.bucket(bucket);
  const tmpFilePath = path.join(os.tmpdir(), path.basename(filePath));
  const metadata = { contentType: contentType };

  const data = [
    {
      destBucket, 
      filePath, 
      tmpFilePath,
      metadata, 
      size: '600x600',
      ext: 'md_'
    },
    {
      destBucket, 
      filePath, 
      tmpFilePath,
      metadata, 
      size: '300x300',
      ext: 'sm_'
    },
    {
      destBucket, 
      filePath, 
      tmpFilePath,
      metadata, 
      size: '100x100',
      ext: 'xs_'
    },
    {
      destBucket, 
      filePath, 
      tmpFilePath,
      metadata, 
      size: '600x600',
      ext: 'md_'
    },
  ]

  return new Promise(() => {
    if(contentType === 'image/jpeg' || contentType === 'image/png') {
      let file = destBucket.file(filePath);
      
      createImage(data[0], file);
      createImage(data[1], file);
      createImage(data[2], file);
      
      rename({destBucket, filePath, tmpFilePath, metadata, ext: 'original_'}, file);
    } else if (contentType === 'video/mp4') {
      let video = destBucket.file(filePath);

      data[3].metadata.contentType = 'image/png';
      createImageVideo(data[3], video);

      rename({destBucket, filePath, tmpFilePath, metadata: { contentType: contentType }, ext: 'original_'}, video);
    }

    return;
  });
});

const createImage = (args, file) => {
  const newFileName = `${args.ext}${path.basename(file.name)}`;
  const newTmpFile = path.join(os.tmpdir(), newFileName);
  
  return file.download({
    destination: args.tmpFilePath
  }).then(() => {
    return spawn('convert', [args.tmpFilePath, '-resize', args.size, newTmpFile]);
  }).then(() => {
    return args.destBucket.upload(newTmpFile, {
      destination: newFileName,
      metadata: args.metadata,
      resumable: false
    })
  })
};

const createImageVideo = (args, file) => {
  const nameNoExt = path.basename(file.name).split('.')[0];
  const newFileName = `${args.ext}${nameNoExt}.png`;
  const newTmpFile = path.join(os.tmpdir(), newFileName);
  
  return file.download({
    destination: args.tmpFilePath
  }).then(() => {
    return spawn('./ffmpeg', ['-ss', '0', '-i', args.tmpFilePath, '-f', 'image2', '-vframes', '1', '-vf', 'scale=512:-1', newTmpFile]);  
  }).then(() => {
    return args.destBucket.upload(newTmpFile, {
      destination: newFileName,
      metadata: args.metadata,
      resumable: false
    })
  })
}

const rename = (args, file) => {
  return file.download({
    destination: args.tmpFilePath
  }).then(() => {
    file.delete((err, response) => {console.log(err); console.log(response);});
    return args.destBucket.upload(args.tmpFilePath, {
      destination: args.ext + path.basename(args.filePath),
      metadata: args.metadata,
      resumable: false
    })
  })
};
