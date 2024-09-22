import Stats from './Stats.js';
import Permissions from './Permissions.js';
export interface FileList {
    filename: string;
    stats: Stats;
}
/**
 * a basic SFTP Client. Written because no other client is even remotely of any use!
 */
export default class SFTPClient {
    private ssh2Connection;
    private sftpClient;
    private currentStatus;
    private statusMap;
    /**
     * set up the class
     */
    constructor();
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
    connect({ hostname, password, port, privateKey, username, }: {
        hostname: string;
        password?: string;
        port: number;
        privateKey?: string;
        username: string;
    }): Promise<this>;
    /**
     * end the client, close the connection
     *
     * @return     {Promise}
     */
    end(): Promise<this>;
    /**
     * get a file as buffer from the server
     */
    getFile(remoteFilePath: string): Promise<Buffer>;
    /**
     * get a read stream pointing to a remote file
     */
    createReadStream(remoteFilePath: string): Promise<NodeJS.ReadableStream>;
    /**
     * write a file to the sftp server
     */
    putFile(remoteFilePath: string, buffer: Buffer): Promise<this>;
    /**
     * get a write stream pointing to a file
     *
     * @param      {string}   remoteFilePath  The remote file path
     * @return     {Promise<writeStream>}  The write stream.
     */
    createtWriteStream(remoteFilePath: string): Promise<NodeJS.WritableStream>;
    /**
     * move a file or directory to a new location
     */
    move(sourceRemotePath: string, targetRemotePath: string): Promise<this>;
    /**
     * set permissions on a path
     */
    setPermissions(remotePath: string, permissions: Permissions): Promise<this>;
    /**
     * delete a file from the server^
     */
    deleteFile(remoteFilePath: string): Promise<this>;
    /**
     * delete a directory and optionally all its contents
     */
    deleteDirectory(remotePath: string, recursive?: boolean): Promise<this>;
    /**
     * Creates a directory.
     *
     * @param      {string}   remotePath  The remote path
     * @param      {boolean}  recursive   create all missing directories of the path
     * @return     {Promise}  this
     */
    createDirectory(remotePath: string, recursive?: boolean): Promise<this>;
    /**
     * stat a remote file
     *
     * @param      {string}   remoteFilePath  The remote file path
     * @return     {Promise}  stats object
     */
    stat(remoteFilePath: string): Promise<Stats>;
    /**
     * checks if a remote path exists
     *
     * @param      {string}   remotePath  The remote path
     * @return     {Promise}  true if it exists, false otherwise
     */
    exists(remotePath: string): Promise<boolean>;
    /**
     * lsit the contents of a directory
     *
     * @param      {string}          remoteDir  The remote dir
     * @param      {boolean}         detailed   return detailed information about the files
     * @return     {Promise<array>}  the file list for the directory
     */
    list(remoteDir: string, detailed?: boolean): Promise<FileList[] | string[]>;
    /**
     * throw a descriptive error if the client is not in the connected state. utility function used
     * by all actions executed on the remote system
     *
     * @private
     *
     * @param      {string}  actionName  The action name
     */
    private needsToBeConnected;
    /**
     * Determines if the client is connected.
     *
     * @private
     *
     * @return     {boolean}  True if the client is connected, False otherwise.
     */
    isConnected(): boolean;
    /**
     * set the status and make sure the lifecycle is managed correctly for this client
     *
     * @private
     *
     * @param      {string}  newStatusName  The new status name
     */
    private setStatus;
}
//# sourceMappingURL=SFTPClient.d.ts.map