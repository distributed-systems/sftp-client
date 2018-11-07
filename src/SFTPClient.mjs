import ssh2 from 'ssh2';
const SSH2Client = ssh2.Client;


const statusMap = new Map([
    ['constructed', 100],
    ['connecting', 200],
    ['connected', 300],
    ['ended', 800],
    ['failed', 900],
]);



/**
 * a basic SFTP Client. Written because no other client is even remotely of any use!
 */

export default class SFTPClient {

    /**
     * set up the class
     */
    constructor() {
        this.setStatus('constructed');
    }



    /**
     * connect to the sftp server
     *
     * @param      {Object}   arg1             options object
     * @param      {string}   arg1.hostname    The hostname
     * @param      {<type>}   arg1.password    The password
     * @param      {number}   arg1.port        The port
     * @param      {<type>}   arg1.privateKey  The private key
     * @param      {string}   arg1.username    The username
     * @return     {Promise}  the client
     */
    async connect({
        hostname = 'localhost',
        password,
        port = 22,
        privateKey,
        username = 'anonymous',
    }) {
        this.setStatus('connecting');

        // the ssh2 client is just used for creating the sftp client
        this.ssh2Connection = new SSH2Client();

        // wrap old-school callbacks ..
        await new Promise((resolve, reject) => {

            // set the correct status and return the error
            const errorHandler = (err) => {console.log(err);
                this.setStatus('failed');
                err.message = `The ssh2 client failed: ${err.message}`;
                reject(err);
            };

            this.ssh2Connection.on('error', (err) => errorHandler);

            // ready to create the sftp client wrapper
            this.ssh2Connection.on('ready', () => {

                // get the sftp channel
                this.ssh2Connection.sftp((err, sftpClient) => {
                    if (err) errorHandler(err);
                    else {
                        this.sftpClient = sftpClient;
                        this.setStatus('connected');
                        resolve();
                    }
                });
            });

            // connect!
            this.ssh2Connection.connect({
                host: hostname,
                password: password,
                port: port,
                privateKey: privateKey,
                username: username,
            });
        });


        return this;
    }




    /**
     * end the client, close the connection
     *
     * @return     {Promise}  
     */
    async end() {
        this.needsToBeConnected('end');
        this.setStatus('ended');
        this.ssh2Connection.end();
    }




    /**
     * get a file as buffer from the server
     *
     * @param      {string}   remoteFilePath  The remote file path
     * @return     {Promise<buffer>}  The file.
     */
    async getFile(remoteFilePath) {
        this.needsToBeConnected('getFile');
        const stream = await this.getReadStream(remoteFilePath);

        return new Promise((resolve, reject) => {
            let buffer;

            stream.on('data', (chunk) => {
                if (buffer) buffer = buffer.concat(chunk);
                else buffer = chunk;
            }); 

            stream.on('error', (err) => {
                err.message = `Failed download file ${remoteFilePath}: ${err.message}`;
            });

            stream.on('end', () => {
                resolve(buffer);
            })
        });
    }





    /**
     * get a read stream pointing to a remote file
     *
     * @param      {string}   remoteFilePath  The remote file path
     * @return     {Promise<readStream>}  The file stream.
     */
    async getReadStream(remoteFilePath) {
        this.needsToBeConnected('getReadStream');

        await this.stat(remoteFilePath).catch((err) => {
            if (err.code === 2) {
                err.message = `Failed to create stream for file '${remoteFilePath}': no such file!`;
            }

            throw err;
        });

        // return the stream as is
        return this.sftpClient.createReadStream(remoteFilePath, {
            highWaterMark: 65535,
            encoding: 'binary',
        });
    }




    /**
     * write a file to the sftp server 
     *
     * @param      {string}   remoteFilePath  The remote file path
     * @param      {buffer}   buffer          file contents
     * @return     {Promise}  SFTPClient instance
     */
    async putFile(remoteFilePath, buffer) {
        this.needsToBeConnected('putFile');
        const writeStream = await this.getWriteStream(remoteFilePath);

        return new Promise((resolve, reject) => {
            writeStream.on('error', reject);
            writeStream.on('close', () => {
                resolve(this);
            });

            writeStream.end(buffer);
        });
    }




    /**
     * get a write stream pointing to a file
     *
     * @param      {string}   remoteFilePath  The remote file path
     * @return     {Promise<writeStream>}  The write stream.
     */
    async getWriteStream(remoteFilePath) {
        this.needsToBeConnected('getWriteStream');

        let writeStream;

        // return the stream as is
        try {
            writeStream = this.sftpClient.createWriteStream(remoteFilePath, {
                highWaterMark: 65535,
                encoding: 'binary',
            });
        } catch (err) {
            err.message = `Failed to create a write stream for the file '${remoteFilePath}': ${err.message}`;
            throw err;
        }


        // make sure the error messages are of any use
        writeStream.on('error', (err) => {
            err.message = `Failed to create a write stream for the file '${remoteFilePath}': ${err.message}`;
        });

        return writeStream;
    }






    async createDirectory(remotePath, recursive = false) {
        this.needsToBeConnected('createDirectory');

    }





    /**
     * stat a remote file
     *
     * @param      {string}   remoteFilePath  The remote file path
     * @return     {Promise}  stats object
     */
    async stat(remoteFilePath) {
        this.needsToBeConnected('stat');

        return await new Promise((resolve, reject) => {
            this.sftpClient.stat(remoteFilePath, (err, stats) => {
                if (err) {
                    if (err.code === 2) {
                        err.message = `Failed to stat file '${remoteFilePath}': no such file!`;
                    }

                    reject(err);
                } else resolve(stats);
            });
        });
    }





    /**
     * checks if a remote path exists
     *
     * @param      {string}   remotePath  The remote path
     * @return     {Promise}  true if it exists, false otherwise
     */
    async exists(remotePath) {
        this.needsToBeConnected('exists');
        return this.stat(remotePath).then((stats) => {
            return !!stats;
        }).catch((err) => {
            if (err.code === 2) {
                return false;
            } else throw err;
        });
    }





    /**
     * lsit the contents of a directory
     *
     * @param      {string}          remoteDir     The remote dir
     * @param      {boolean}         includeStats  if true, instead of filepaths an list of objects
     *                                             is returned
     * @return     {Promise<array>}  the file list for the directory
     */
    async readDir(remoteDir, includeStats = false) {
        this.needsToBeConnected('readDir');
        
        return new Promise((resolve, reject) => {
            this.sftpClient.readdir(remoteDir, (err, fileList) => {
                if (err) {
                    if (err.code === 2) {
                        err.message = `Failed to read directory '${remoteDir}': no such directory!`;
                    } else {
                        err.message = `Failed to read directory '${remoteDir}': ${err.message}`;
                    }

                    reject(err);
                } else {
                    if (includeStats) {
                        fileList = fileList.map(item => ({
                            filename: item.filename,
                            stats: item.attrs,
                        }));
                    } else {
                        fileList = fileList.map(item => item.filename);
                    }

                    resolve(fileList);
                }
            });
        });
    }




    /**
     * throw a descriptive error if the client is not in the connected state. utility function used
     * by all actions executed on the remote system
     * 
     * @private
     *
     * @param      {string}  actionName  The action name
     */
    needsToBeConnected(actionName) {
        if (!this.isConnected()) {
            throw new Error(`Cannot execute the '${actionName}' action, the client has an invalid status '${this.currentStatus}'!`);
        }
    }


    
    /**
     * Determines if the client is connected.
     * 
     * @private
     *
     * @return     {boolean}  True if the client is connected, False otherwise.
     */
    isConnected() {
        return this.currentStatus === 'connected';
    }




    /**
     * set the status and make sure the lifecycle is managed correctly for this client
     * 
     * @private
     *
     * @param      {string}  newStatusName  The new status name
     */
    setStatus(newStatusName) {
        if (!statusMap.has(newStatusName)) {
            throw new Error(`Cannot set unknown status '${newStatusName}'!`);
        }

        if (this.currentStatus && 
            statusMap.get(newStatusName) <= statusMap.get(this.currentStatus)) {

            throw new Error(`Cannot set status '${newStatusName}' when the current status is '${this.currentStatus}'!`);
        }

        this.currentStatus = newStatusName;
    }
}
