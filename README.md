# SFTP Client

A simple, fully tested and reliable SFTP Client.


## Function Reference


- <a href="#class-sftpclient">Class SFTPClient</a>
    - <a href="#sftpclient.connect-(credentials)">connect (credentials)</a>
    - <a href="#sftpclient.createdirectory-(directoryPath,-recursive-=-false)">createDirectory (directoryPath, recursive = false)</a>
    - <a href="#sftpclient.createreadstream-(filepath)">createReadStream (filePath)</a>
    - <a href="#overview">createWriteStream (filePath)</a>
    - <a href="#overview">deleteDirectory (directoryPath, recursive = false)</a>
    - <a href="#overview">deleteFile (filePAth)</a>
    - <a href="#overview">end ()</a>
    - <a href="#overview">exists (path)</a>
    - <a href="#overview">getFile (filePath)</a>
    - <a href="#overview">list (path)</a>
    - <a href="#overview">move (sourcePath, targetPath)</a>
    - <a href="#overview">putFile (filePath, dataBuffer)</a>
    - <a href="#overview">setPermissions (filePath, permissions)</a>
    - <a href="#overview">stat (path)</a>
- <a href="#overview">Class Permissions</a>
- <a href="#overview">Examples</a>



## Class SFTPClient

The SFTPClient class provides all functionality to interact with the 
SFTP-Server. You may connect to the server using a password or a private key.


Example: get a file from a sftp server using a password
```javascript
import SFTPClient from '@distributed-systems/sftp-client';


// represents one connection to the server
const client = new SFTPClient();


// conenct using a password
await client.connect({
    hostname: 'l.dns.porn',
    port: 22,
    username: 'eventEmitter',
    password: 'totally-secure',
});


// get the file as a buffer
const file = await client.getFile('/home/eventEmitter/nice-file.dat');

client.end();
```


### SFTPClient.connect (credentials)

The `connect` method is used to open the connection to the server. It accepts an 
options object containing the required credentials.

You can either connect using a password or a private-key. You can use both
methods at the same time. The first method that results in success will be used
then.


**Connect using a password**
```javascript
await client.connect({
    hostname: 'l.dns.porn',
    port: 22,
    username: 'eventEmitter',
    password: 'totally-secure',
});
```


**Connect using a private-key**
```javascript
import fs from 'fs';

const privateKey = await fs.promises.readFile('/home/eventEmitter/.ssh/id_rsa');

await client.connect({
    hostname: 'l.dns.porn',
    port: 22,
    username: 'eventEmitter',
    privateKey: privateKey,
});
```


### SFTPClient.createDirectory (directoryPath, recursive = false)

Creates a directory on the server. Can create an entire path if the `recursive` 
parameter is set to `true`.


**Create a directory**
```javascript
await client.createDirectory('best-directory-ever');
```


**Create an entire path**
```javascript
await client.createDirectory('best-directory-ever/awesome-directory', true);
```




### SFTPClient.createReadStream (filePath)

Downloads a file using a readable stream. The stream has the same API as 
standard [node.js readable streams](https://nodejs.org/dist/latest/docs/api/stream.html#stream_readable_streams). This is the method you should use 
to download files to the file-system.


**Download a file to the file-system**
```javascript
import fs from 'fs';

// create the readable stream for the file you like to download
const readStream = await client.createReadStream('fancy-file.fancy');


// create a write stream for the file the data should be stored in
const writeStream = fs.createWriteStream('/home/eventEmitter/fancy-file.fancy');


// pipe the stream
readStream.pipe(writeStream);


// get notified when the stream has finished
writeStream.on('close', () => {
    console.log('the file was successfully saved!');
});
```


**Create a SHA1 Checksum of the file**
```javascript
import crypto from 'crypto';

const hash = crypto.createHash('sha1');

// create the readable stream for the file you like to hash
const readStream = await client.createReadStream('fancy-file.fancy');

// feed the data to the hash
readStream.on('data', (buffer) => {
    hash.update(buffer);
});


// log the checksum
readStream.on('close', () => {
    console.log(hash.digest('hex'));
});
```