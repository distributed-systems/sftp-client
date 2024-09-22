import Permissions from './Permissions.js';
import * as ssh2 from 'ssh2';
/**
 * wrapper for the sftp internal stats class
 *
 * @class      Stats (name)
 */
export default class Stats {
    sftpStats: any;
    permissions: Permissions;
    uid: number;
    gid: number;
    size: number;
    atime: number;
    mtime: number;
    /**
     * set up the stats class
     */
    constructor(sftpStats: ssh2.Stats);
    isDirectory(): any;
    isFile(): any;
    isBlockDevice(): any;
    isCharacterDevice(): any;
    isSymbolicLink(): any;
    isFIFO(): any;
    isSocket(): any;
    /**
     * Returns a string representation of the object.
     *
     * @return     {string}  String representation of the object.
     */
    toString(): string;
}
//# sourceMappingURL=Stats.d.ts.map