const functions = require('firebase-functions');
const { Storage } = require('@google-cloud/storage');
const os = require('os');
const path = require('path');
const spawn = require('child-process-promise').spawn;
const crypto = require('crypto');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

exports.onFileChange = functions.storage.object().onFinalize(event => {
  const bucket = event.bucket;
  const contentType = event.contentType;
  const filePath = event.name;

  console.log('File changed, function execution started');

  if(path.basename(filePath).startsWith('original_') || path.basename(filePath).startsWith('md_') || path.basename(filePath).startsWith('sm_') || path.basename(filePath).startsWith('xs_')) {
    console.log('We already renamed that file');
    return;
  }

  // let random = crypto.randomBytes(20).toString('hex');

  const storage = new Storage();
  const destBucket = storage.bucket(bucket);
  const tmpFilePath = path.join(os.tmpdir(), path.basename(filePath));
  const metadata = { constentType: contentType };
  

  // let created = [];

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
  ]

  
  // {
  //   destBucket, 
  //   filePath, 
  //   tmpFilePath,
  //   metadata, 
  //   ext: 'original_'
  // }

  return new Promise(() => {
    let file = destBucket.file(filePath);
    
    createImage(data[0], file);
    createImage(data[1], file);
    createImage(data[2], file);
    
    rename({destBucket, filePath, tmpFilePath, metadata, ext: 'original_'}, file);
    
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
      metadata: args.metadata
    })
  })
};

const rename = (args, file) => {
  return file.download({
    destination: args.tmpFilePath
  }).then(() => {
    file.delete((err, response) => {console.log(err); console.log(response);});
    return args.destBucket.upload(args.tmpFilePath, {
      destination: args.ext + path.basename(args.filePath),
      metadata: args.metadata
    })
  })
};