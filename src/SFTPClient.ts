import Stats from './Stats.js';
import Permissions from './Permissions.js';
import ssh2 from 'ssh2';
import path from 'path';
import logd from 'logd';

// set up a logger
const log = logd.module('sftp-client');

const SSH2Client = ssh2.Client;




export interface FileList {
    filename: string;
    stats: Stats;
}


/**
 * a basic SFTP Client. Written because no other client is even remotely of any use!
 */

export default class SFTPClient {

    private ssh2Connection: ssh2.Client;
    private sftpClient: ssh2.SFTPWrapper;
    private currentStatus: string;
    private statusMap: Map<string, number> = new Map([
        ['constructed', 100],
        ['connecting', 200],
        ['connected', 300],
        ['ended', 800],
        ['failed', 900],
    ]);

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
    public async connect({
        hostname = 'localhost',
        password,
        port = 22,
        privateKey,
        username = 'anonymous',
    } : {
        hostname: string,
        password?: string,
        port: number,
        privateKey?: string,
        username: string,
    }) : Promise<this> {
        if (!password && !privateKey) {
            const err = new Error('Cannot connect to the SFTP server: no password or private key provided!');
            log.error(err);
            throw err;
        }

        this.setStatus('connecting');

        // the ssh2 client is just used for creating the sftp client
        this.ssh2Connection = new SSH2Client();

        // wrap old-school callbacks ..
        await new Promise<void>((resolve, reject) => {

            // set the correct status and return the error
            const errorHandler = (err: any) => {
                this.setStatus('failed');
                err.message = `The ssh2 client failed: ${err.message}`;
                log.error(err);
                reject(err);
            };

            this.ssh2Connection.on('error', errorHandler);

            // ready to create the sftp client wrapper
            this.ssh2Connection.on('ready', () => {
                log.info('Connected to the SFTP server');

                // get the sftp channel
                this.ssh2Connection.sftp((err, sftpClient) => {
                    if (err) errorHandler(err);
                    else {
                        this.sftpClient = sftpClient;
                        this.setStatus('connected');

                        log.success('SFTP client connected');

                        resolve();
                    }
                });
            });

            log.debug(`Connecting to SFTP server ${hostname}:${port} as ${username}`);
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
    public async end() : Promise<this> {
        this.needsToBeConnected('end');
        this.setStatus('ended');
        this.ssh2Connection.end();
        log.info('SFTP client ended');
        return this;
    }




    /**
     * get a file as buffer from the server
     */
    public async getFile(remoteFilePath: string) : Promise<Buffer> {
        this.needsToBeConnected('getFile');
        const stream = await this.createReadStream(remoteFilePath);

        return new Promise((resolve, reject) => {
            let buffer : Buffer;

            stream.on('data', (chunk : Buffer) => {
                log.debug(`Received ${chunk.length} bytes of data`);
                if (buffer) buffer = Buffer.concat([buffer, chunk]);
                else buffer = chunk;
            }); 

            stream.on('error', (err: any) => {
                err.message = `Failed download file ${remoteFilePath}: ${err.message}`;
                log.error(err);
                reject(err);
            });

            stream.on('end', () => {
                log.success(`Downloaded file ${remoteFilePath} with ${buffer.length} bytes`);
                resolve(buffer);
            })
        });
    }





    /**
     * get a read stream pointing to a remote file
     */
    public async createReadStream(remoteFilePath: string) : Promise<NodeJS.ReadableStream> {
        this.needsToBeConnected('createReadStream');

        await this.stat(remoteFilePath).catch((err) => {
            if (err.code === 2) {
                err.message = `Failed to create stream for file '${remoteFilePath}': no such file!`;
            }

            log.error(err);
            throw err;
        });

        const readStream = this.sftpClient.createReadStream(remoteFilePath);


        /*
        // 2024: seems to be fixed and relying on node streams now

        // since the ssh2 library this client relies on has a faulty implementation regarding
        // the destroy method, I'm going to monkey patch this here.
        // original issue: https://github.com/mscdex/ssh2-streams/issues/112
        const originalDestroy = readStream.destroy.bind(readStream);

        readStream.destroy = function(err) {
            if (err) this.emit('error', err);
            originalDestroy();
        }
        */

        log.info(`Created read stream for file '${remoteFilePath}'`);

        return readStream;
    }




    /**
     * write a file to the sftp server 
     */
    public async putFile(remoteFilePath: string, buffer: Buffer) : Promise<this> {
        this.needsToBeConnected('putFile');
        const writeStream = await this.createtWriteStream(remoteFilePath);

        return new Promise((resolve, reject) => {
            writeStream.on('error', (err: any) => {
                err.message = `Failed to write file '${remoteFilePath}': ${err.message}`;
                log.error(err);
                reject(err);
            });

            writeStream.on('close', () => {
                log.success(`Wrote file '${remoteFilePath}' with ${buffer.length} bytes`);
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
    public async createtWriteStream(remoteFilePath: string) : Promise<NodeJS.WritableStream> {
        this.needsToBeConnected('createtWriteStream');

        let writeStream;

        // return the stream as is
        try {
            writeStream = this.sftpClient.createWriteStream(remoteFilePath, {
                highWaterMark: 65535,
                encoding: 'binary',
            });
        } catch (err: any) {
            err.message = `Failed to create a write stream for the file '${remoteFilePath}': ${err.message}`;
            log.error(err);
            throw err;
        }


        // make sure the error messages are of any use
        writeStream.on('error', (err: any) => {
            err.message = `Failed to create a write stream for the file '${remoteFilePath}': ${err.message}`;
            log.error(err);
        });

        log.info(`Created write stream for file '${remoteFilePath}'`);
        return writeStream;
    }






    /**
     * move a file or directory to a new location
     */
    public async move(sourceRemotePath: string, targetRemotePath: string) : Promise<this> {
        this.needsToBeConnected('move');

        const sourceExists = await this.exists(sourceRemotePath);
        if (!sourceExists) {
            const err = new Error(`Cannot move path '${sourceRemotePath}': it does not exist!`);
            log.error(err);
            throw err;
        }

        const targetExists = await this.exists(targetRemotePath);
        if (targetExists) {
            const err = new Error(`Cannot move path '${sourceRemotePath}': target path '${targetRemotePath}' exists already!`);
            log.error(err);
            throw err;
        }

        return await new Promise((resolve, reject) => {
            this.sftpClient.rename(sourceRemotePath, targetRemotePath, (err) => {
                if (err) {
                    err.message = `Failed to move path '${sourceRemotePath}': ${err.message}`;
                    log.error(err);
                    reject(err);
                } else {
                    log.success(`Moved path '${sourceRemotePath}' to '${targetRemotePath}'`);
                    resolve(this);
                }
            });
        });
    }







    /**
     * set permissions on a path
     */
    public async setPermissions(remotePath: string, permissions: Permissions) : Promise<this> {
        this.needsToBeConnected('setPermissions');

        const targetExists = await this.exists(remotePath);
        if (!targetExists) {
            const err = new Error(`Cannot set permissions on path '${remotePath}': path does not exist!`);
            log.error(err);
            throw err;
        }

        return await new Promise((resolve, reject) => {
            this.sftpClient.chmod(remotePath, permissions.getMode(), (err) => {
                if (err) {
                    err.message = `Failed to set permissions on path '${remotePath}': ${err.message}`;
                    log.error(err);
                    reject(err);
                } else {
                    log.success(`Set permissions on path '${remotePath}' to ${permissions}`);
                    resolve(this);
                }
            });
        });
    }





    /**
     * delete a file from the server^
     */
    public async deleteFile(remoteFilePath: string) : Promise<this> {
        this.needsToBeConnected('deleteFile');

        const fileExists = await this.exists(remoteFilePath);

        if (!fileExists) {
            const err = new Error(`Cannot delete file '${remoteFilePath}': it does not exist!`);
            log.error(err);
            throw err;
        }

        // check if we're trying to delete a directory
        const stats = await this.stat(remoteFilePath);

        if (stats.isDirectory()) {
            const err = new Error(`Cannot delete file '${remoteFilePath}': path is a directory!`);
            log.error(err);
            throw err;
        } else if (!stats.isFile() && !stats.isSymbolicLink()) {
            const err = new Error(`Cannot delete file '${remoteFilePath}': path is not a file!`);
            log.error(err);
            throw err;
        }
        

        return await new Promise((resolve, reject) => {
            this.sftpClient.unlink(remoteFilePath, (err) => {
                if (err) {
                    err.message = `Failed to delete file '${remoteFilePath}': ${err.message}`;
                    log.error(err);
                    reject(err);
                } else {
                    log.success(`Deleted file '${remoteFilePath}'`);
                    resolve(this);
                }
            });
        });
    }






    /**
     * delete a directory and optionally all its contents
     */
    public async deleteDirectory(remotePath: string, recursive = false) : Promise<this> {
        this.needsToBeConnected('deleteDirectory');
        
        const fileExists = await this.exists(remotePath);

        if (!fileExists) {
            const err = new Error(`Cannot delete directory '${remotePath}': it does not exist!`);
            log.error(err);
            throw err;
        }

        const stats = await this.stat(remotePath);

        if (!stats.isDirectory()) {
            const err = new Error(`Cannot delete directory '${remotePath}': path is not a directory!`);
            log.error(err);
            throw err;
        }

        const files = await this.list(remotePath, true) as FileList[];

        if (files.length && !recursive) {
            const err = new Error(`Cannot delete directory '${remotePath}': it contains files!`);
            log.error(err);
            throw err;
        }


        for (const file of files) {
            if (file.stats.isDirectory()) {
                await this.deleteDirectory(path.join(remotePath, file.filename), recursive);
            } else {
                await this.deleteFile(path.join(remotePath, file.filename));
            }
        }

        return this;
    }





    /**
     * Creates a directory.
     *
     * @param      {string}   remotePath  The remote path
     * @param      {boolean}  recursive   create all missing directories of the path
     * @return     {Promise}  this
     */
    public async createDirectory(remotePath: string, recursive = false) : Promise<this> {
        this.needsToBeConnected('createDirectory');

        // check if the directory exists already
        const exists = await this.exists(remotePath);
        if (exists) {
            const err = new Error(`Cannot create directory '${remotePath}', the path does already exist!`);
            log.error(err);
            throw err;
        }

        const parentDir = path.dirname(remotePath);
        const parentDirExists = await this.exists(parentDir);

        // create parent directories 
        if (!parentDirExists) {
            if (recursive) await this.createDirectory(parentDir, recursive);
            else {
                const err = new Error(`Cannot create directory '${remotePath}', the parent directory '${parentDir}' does not exist!`);
                log.error(err);
                throw err;
            }
        }


        return await new Promise((resolve, reject) => {
            this.sftpClient.mkdir(remotePath, (err) => {
                if (err) {
                    err.message = `Failed to create directory '${remotePath}': ${err.message}`;
                    log.error(err);
                    reject(err);
                } else {
                    log.success(`Created directory '${remotePath}'`);
                    resolve(this);
                }
            });
        });
    }





    /**
     * stat a remote file
     *
     * @param      {string}   remoteFilePath  The remote file path
     * @return     {Promise}  stats object
     */
    public async stat(remoteFilePath: string) : Promise<Stats> {
        this.needsToBeConnected('stat');

        return await new Promise((resolve, reject) => {
            this.sftpClient.stat(remoteFilePath, (err: any, stats) => {
                if (err) {
                    if (err.code === 2) {
                        err.message = `Failed to stat file '${remoteFilePath}': no such file!`;
                    }
                    log.error(err);
                    reject(err);
                } else {
                    log.success(`Stated file '${remoteFilePath}'`);
                    resolve(new Stats(stats));
                }
            });
        });
    }





    /**
     * checks if a remote path exists
     *
     * @param      {string}   remotePath  The remote path
     * @return     {Promise}  true if it exists, false otherwise
     */
    public async exists(remotePath: string ) : Promise<boolean> {
        this.needsToBeConnected('exists');

        return this.stat(remotePath).then((stats) => {
            const exists = !!stats;
            log.success(`Path '${remotePath}' exists: ${exists}`);
            return !!stats;
        }).catch((err) => {
            if (err.code === 2) {
                log.success(`Path '${remotePath}' exists: false`);
                return false;
            } else {
                log.error(err);
                throw err;
            }
        });
    }







    /**
     * lsit the contents of a directory
     *
     * @param      {string}          remoteDir  The remote dir
     * @param      {boolean}         detailed   return detailed information about the files
     * @return     {Promise<array>}  the file list for the directory
     */
    public async list(remoteDir: string, detailed = false) : Promise<FileList[] | string[]> {
        this.needsToBeConnected('readDir');

        return new Promise((resolve, reject) => {
            this.sftpClient.readdir(remoteDir, (err: any, fileList) => {
                if (err) {
                    if (err.code === 2) {
                        err.message = `Failed to read directory '${remoteDir}': no such directory!`;
                    } else {
                        err.message = `Failed to read directory '${remoteDir}': ${err.message}`;
                    }
                    log.error(err);

                    reject(err);
                } else {
                    if (detailed) {
                        const list : FileList[] = fileList.map(item => ({
                            filename: item.filename,
                            stats: new Stats(item.attrs),
                        }));

                        log.success(`Read directory '${remoteDir}' with ${list.length} entries`);

                        resolve(list);
                    } else {
                        log.success(`Read directory '${remoteDir}' with ${fileList.length} entries`);
                        resolve(fileList.map(item => item.filename));
                    }
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
    private needsToBeConnected(actionName: string) {
        if (!this.isConnected()) {
            const err = new Error(`Cannot execute the '${actionName}' action, the client has an invalid status '${this.currentStatus}'!`);
            log.error(err);
            throw err;
        }
    }


    
    /**
     * Determines if the client is connected.
     * 
     * @private
     *
     * @return     {boolean}  True if the client is connected, False otherwise.
     */
    public isConnected() {
        log.debug(`Client is connected: ${this.currentStatus === 'connected'}`);
        return this.currentStatus === 'connected';
    }




    /**
     * set the status and make sure the lifecycle is managed correctly for this client
     * 
     * @private
     *
     * @param      {string}  newStatusName  The new status name
     */
    private setStatus(newStatusName: string) {
        if (!this.statusMap.has(newStatusName)) {
            throw new Error(`Cannot set unknown status '${newStatusName}'!`);
        }

        if (this.currentStatus && 
            this.statusMap.get(newStatusName)! <= this.statusMap.get(this.currentStatus)!) {

            throw new Error(`Cannot set status '${newStatusName}' when the current status is '${this.currentStatus}'!`);
        }

        this.currentStatus = newStatusName;
    }
}
