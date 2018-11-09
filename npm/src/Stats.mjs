import Permissions from './Permissions.mjs';

/**
 * wrapper for the sftp internal stats class
 *
 * @class      Stats (name)
 */

export default class Stats {


    /**
     * set up the stats class
     *
     * @param      {object}  sftpStats  The sftp stats class instance
     */
    constructor(sftpStats) {
        Object.defineProperty(this, 'sftpStats', {
            value: sftpStats,
        });

        this.uid = sftpStats.uid;
        this.gid = sftpStats.gid;
        this.size = sftpStats.size;
        this.atime = sftpStats.atime * 1000;
        this.mtime = sftpStats.mtime * 1000;


        this.permissions = new Permissions(sftpStats.permissions);
    }




    isDirectory() {
        return this.sftpStats.isDirectory();
    }


    isFile() {
        return this.sftpStats.isFile();
    }


    isBlockDevice() {
        return this.sftpStats.isBlockDevice();
    }


    isCharacterDevice() {
        return this.sftpStats.isCharacterDevice();
    }


    isSymbolicLink() {
        return this.sftpStats.isSymbolicLink();
    }


    isFIFO() {
        return this.sftpStats.isFIFO();
    }


    isSocket() {
        return this.sftpStats.isSocket();
    }


    /**
     * Returns a string representation of the object.
     *
     * @return     {string}  String representation of the object.
     */
    toString() {
        const str = [];

        // file type
        if (this.isDirectory()) {
            str.push('d');
        } else if (this.isFile()) {
            str.push('-');
        } else if (this.isBlockDevice()) {
            str.push('b');
        } else if (this.isCharacterDevice()) {
            str.push('c');
        } else if (this.isSymbolicLink()) {
            str.push('l');
        } else if (this.isFIFO()) {
            str.push('p');
        } else if (this.isSocket()) {
            str.push('s');
        } else {
            throw new TypeError(`unexpected file type`);
        }

        return str.join('') + this.permissions.toString();
    }
}
