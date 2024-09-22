# SFTP Client


100% Typescript SFTP client



## Function Reference


- <a href="#class-sftpclient">Class SFTPClient</a>
    - <a href="#sftpclientconnect-credentials">connect (credentials)</a>
    - <a href="#sftpclientcreatedirectory-directorypath-recursive--false">createDirectory (directoryPath, recursive = false)</a>
    - <a href="#sftpclientcreatereadstream-filepath">createReadStream (filePath)</a>
    - <a href="#sftpclientcreatewritestream-filepath">createWriteStream (filePath)</a>
    - <a href="#sftpclientdeletedirectory-directorypath-recursive--false">deleteDirectory (directoryPath, recursive = false)</a>
    - <a href="#sftpclientdeletefile-filepath">deleteFile (filePath)</a>
    - <a href="#sftpclientend-">end ()</a>
    - <a href="#sftpclientexists-path">exists (path)</a>
    - <a href="#sftpclientgetfile-filepath">getFile (filePath)</a>
    - <a href="#sftpclientlist-path-detailed--false">list (path, detailed = false)</a>
    - <a href="#sftpclientmove-sourcepath-targetpath">move (sourcePath, targetPath)</a>
    - <a href="#sftpclientputfile-filepath-databuffer">putFile (filePath, dataBuffer)</a>
    - <a href="#sftpclientsetpermissions-filepath-permissions">setPermissions (filePath, permissions)</a>
    - <a href="#sftpclientstat-path">stat (path)</a>
- <a href="#class-permissions">Class Permissions</a>
- <a href="#class-stats">Class Stats</a>
    - <a href="#statsisblockdevice-">isBlockDevice ()</a>
    - <a href="#statsischaracterdevice-">isCharacterDevice ()</a>
    - <a href="#statsisdirectory-">isDirectory ()</a>
    - <a href="#statsisfifo-">isFIFO ()</a>
    - <a href="#statsisfile-">isFile ()</a>
    - <a href="#statsissocket-">isSocket ()</a>
    - <a href="#statsissymboliclink-">isSymbolicLink ()</a>



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
    username: 'linaGirl',
    password: 'totally-secure',
});


// get the file as a buffer
const file = await client.getFile('/home/linaGirl/nice-file.dat');

client.end();
```


### SFTPClient.connect (credentials)

The `connect` method is used to open the connection to the server. It accepts an 
options object containing the required credentials.

You can either connect using a password or a private-key. You can use both
methods at the same time. The first method that results in success will be used
then.

Returns the sftpClient instance.


**Connect using a password**
```javascript
await client.connect({
    hostname: 'l.dns.porn',
    port: 22,
    username: 'linaGirl',
    password: 'totally-secure',
});
```


**Connect using a private-key**
```javascript
import fs from 'fs';

const privateKey = await fs.promises.readFile('/home/linaGirl/.ssh/id_rsa');

await client.connect({
    hostname: 'l.dns.porn',
    port: 22,
    username: 'linaGirl',
    privateKey: privateKey,
});
```


### SFTPClient.createDirectory (directoryPath, recursive = false)

Creates a directory on the server. Can create an entire path if the `recursive` 
parameter is set to `true`.


Returns the sftpClient instance.


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

Returns a readable stream.


**Download a file to the file-system**
```javascript
import fs from 'fs';

// create the readable stream for the file you like to download
const readStream = await client.createReadStream('fancy-file.fancy');


// create a write stream for the file the data should be stored in
const writeStream = fs.createWriteStream('/home/linaGirl/fancy-file.fancy');


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





### SFTPClient.createWriteStream (filePath)

Uploads a file using a writable stream. The stream has the same API as 
standard [node.js writable streams](https://nodejs.org/dist/latest/docs/api/stream.html#stream_writable_streams). 

Returns a writable stream.


**Download a file from the file-system**
```javascript
import fs from 'fs';

// create the writable stream for the file you like to upload
const writeStream = await client.createReadStream('fancy-file.fancy');


// create a read stream for the file the data should be read from
const readStream = fs.createReadStream('/home/linaGirl/fancy-file.fancy');


// pipe the stream
readStream.pipe(writeStream);


// get notified when the stream has finished
writeStream.on('close', () => {
    console.log('the file was successfully uploaded!');
});
```





### SFTPClient.deleteDirectory (directoryPath, recursive = false)

Deletes a directory on the server. Can recursively delete all contained files
and directories if the `recursive` parameter is set to `true`.

Returns the sftpClient instance.


**Delete a directory**
```javascript
await client.deleteDirectory('best-directory-ever');
```


**Delete a directory recursively**
```javascript
await client.deleteDirectory('best-directory-ever', true);
```



### SFTPClient.deleteFile (filePath)

Deletes one file.

Returns the sftpClient instance.


**Delete a file**
```javascript
await client.deleteFile('/path/to/file/that/needs/to.go');
```





### SFTPClient.end ()

Ends the connection to the server.

Returns the sftpClient instance.


**End the connection**
```javascript
await client.end();
```





### SFTPClient.exists (path)

checks if a file or directory exists.

Returns a boolean.


**Check if a file exists**
```javascript
const fileExists = await client.exists('path/to/file');
```


**Check if a directory exists**
```javascript
const fileExists = await client.exists('path/to/directory');
```




### SFTPClient.getFile (filePath)

Downloads a file into a buffer.

Returns a buffer containing the requested file.


**Download a file**
```javascript
const fileBuffer = await client.getFile('/path/to.file');
```




### SFTPClient.list (path, detailed = false)

Lists the path specified. The path may be a file or a directory.

Returns an array containing file-names or an array containing objects containing
detailed information about the files.


**List files of a directory**
```javascript
const filenames = await client.list('path/to/directory');

console.log(filenames);
// ['a.mjs', 'directory', 'z.jpg']
```



**List files of a directory, return details**
```javascript
const files = await client.list('path/to/directory', true);

console.log(files);
[{filename: 'a.mjs', stats: StatsObject}]
```

See  <a href="#class-stats">Class Stats</a> for the contents of the StatsObject






### SFTPClient.move (sourcePath, targetPath)

Moves a file or directory from the `sourcePath` to the `targetPath`. Can be used
to rename files and directories.

Returns the sftpClient instance.


**Rename a file**
```javascript
await client.move('nice-code.mjs', 'legacy-code.mjs');
```


**Move a directory**
```javascript
await client.move('directory', 'some/path/for/the/directory');
```





### SFTPClient.putFile (filePath, dataBuffer)

Uploads a file from a buffer.

Returns the sftpClient instance.


**Upload a file**
```javascript
await client.putFile('/path/to.file', buffer);
```




### SFTPClient.setPermissions (filePath, permissions)

Sets the permissions on a file. If you need to get the permissions of a file you 
can <a href="#sftpclientstat-path">stat</a> it!

Returns the sftpClient instance.


**Set the permissions on a file**
```javascript
import { Permissions } from '@distributed-systems/sftp-client';

// give the user read permissions
const permissions = new Permissions();
permissions.user.read = true;

await client.setPermissions('path/to/file', permissions);
```

See  <a href="#class-permissions">Class Permissions</a> for details about the permissions object.






### SFTPClient.stat (path)

Get stats about the file. Reports the type of the file and its permissions.

Returns an instance of the <a href="#class-stats">Stats class</a>.


**get stats for a file**
```javascript
const stats = await client.stat('path/to/file');
```

See  <a href="#class-stats">Class Stats</a> for the contents of the stats object.




## Class Permissions

The Permissions class holds information about the permissions of a file-system 
object. It can be used to get the type of an object. It can also be used to read 
or write the permissions of an object.

The permissions object is returned as a property of the <a href="#class-stats">stats</a> object by the <a href="#sftpclientstat-path">stat</a> and the <a href="#sftpclientlist-path-detailed--false">list</a> calls.
It can be passed to the <a href="#sftpclientsetpermissions-filepath-permissions">setPermissions</a> call for changing permissions for an object.


The object exposes properties for the permissions for the `user`, the `group` an for
`other` Each of those properties is an object with three writable properties which
indicate the `read`, `write` and `execute` permissions.


**Give all permissions to everyone**
```javascript
import { Permissions } from '@distributed-systems/sftp-client';

const permissions = new Permissions();

permissions.user.read = true;
permissions.user.write = true;
permissions.user.execute = true;

permissions.group.read = true;
permissions.group.write = true;
permissions.group.execute = true;

permissions.other.read = true;
permissions.other.write = true;
permissions.other.execute = true;

await client.setPermissions('path/to/file', permissions);
```

**Check if the user has write permissions on a file**
```javascript
const stats = await client.stat('path/to/file');

console.log(stats.permissions.user.write); // true or false
```



## Class Stats

The stats object is returned by the <a href="#sftpclientstat-path">stat</a> and the <a href="#sftpclientlist-path-detailed--false">list</a> calls.

The object has a property containing a <a href="#class-permissions">permissions</a> object and a bunch of methods
that can be used to determine the type of the path the stat call was made on. 


**Get stats using the stat method**
```javascript
const stats = await client.stat('path/to/file');
```





### Stats.isBlockDevice ()

Returns `true` if the path is a block device, `false` otherwise.

**check if the path is a block device**
```javascript
const stats = await client.stat('path/to/file/or/directory');

console.log(stats.isBlockDevice()); // true or false
```



### Stats.isCharacterDevice ()

Returns `true` if the path is a character device, `false` otherwise.

**check if the path is a character device**
```javascript
const stats = await client.stat('path/to/file/or/directory');

console.log(stats.isCharacterDevice()); // true or false
```



### Stats.isDirectory ()

Returns `true` if the path is a directory, `false` otherwise.

**check if the path is a directory**
```javascript
const stats = await client.stat('path/to/file/or/directory');

console.log(stats.isDirectory()); // true or false
```



### Stats.isFIFO ()

Returns `true` if the path is a named pipe, `false` otherwise.

**check if the path is a named pipe**
```javascript
const stats = await client.stat('path/to/file/or/directory');

console.log(stats.isFIFO()); // true or false
```



### Stats.isFile ()

Returns `true` if the path is a regular file, `false` otherwise.

**check if the path is a regular file**
```javascript
const stats = await client.stat('path/to/file/or/directory');

console.log(stats.isFile()); // true or false
```



### Stats.isSocket ()

Returns `true` if the path is a socket, `false` otherwise.

**check if the path is a socket**
```javascript
const stats = await client.stat('path/to/file/or/directory');

console.log(stats.isSocket()); // true or false
```



### Stats.isSymbolicLink ()

Returns `true` if the path is a symbolic link, `false` otherwise.

**check if the path is a symbolic link**
```javascript
const stats = await client.stat('path/to/file/or/directory');

console.log(stats.isSymbolicLink()); // true or false
```
