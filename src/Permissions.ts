// code partially from  https://github.com/TooTallNate/stat-mode/blob/master/index.js

const S_ISUID = 2048;   /* 0004000 set user id on execution */
const S_ISGID = 1024;   /* 0002000 set group id on execution */
const S_ISVTX = 512;    /* 0001000 save swapped text even after use */

// const S_IRUSR = 256;    /* 0000400 read permission, owner */
// const S_IWUSR = 128;    /* 0000200 write permission, owner */
// const S_IXUSR = 64;     /* 0000100 execute/search permission, owner */

// const S_IRGRP = 32;     /* 0000040 read permission, group */
// const S_IWGRP = 16;     /* 0000020 write permission, group */
// const S_IXGRP = 8;      /* 0000010 execute/search permission, group */

// const S_IROTH = 4;      /* 0000004 read permission, others */
// const S_IWOTH = 2;      /* 0000002 write permission, others */
// const S_IXOTH = 1;      /* 0000001 execute/search permission, others */


interface PermissionObject {
    read: boolean;
    write: boolean;
    execute: boolean;
}


export default class Permissions {

    public permissions: number;

    private permissionMap : Map<string, number> = new Map([
        [ 'read', 4 ],
        [ 'write', 2 ],
        [ 'execute', 1 ],
    ]);

    private targetMap : Map<string, number> = new Map([
        [ 'user', 64 ],
        [ 'group', 8 ],
        [ 'other', 1 ],
    ]);

    public user: PermissionObject = { read: false, write: false, execute: false };
    public group: PermissionObject = { read: false, write: false, execute: false };
    public other: PermissionObject = { read: false, write: false, execute: false };


    get setuid() {
        return Boolean(this.permissions & S_ISUID);
    }

    set setuid(status) {
        if (status) {
            this.permissions |= S_ISUID;
        } else {
            this.permissions &= ~S_ISUID;
        }
    }



    get setgid() {
        return Boolean(this.permissions & S_ISGID);
    }

    set setgid(status) {
        if (status) {
            this.permissions |= S_ISGID;
        } else {
            this.permissions &= ~S_ISGID;
        }
    }



    get sticky() {
        return Boolean(this.permissions & S_ISVTX);
    }

    set sticky(status) {
        if (status) {
            this.permissions |= S_ISVTX;
        } else {
            this.permissions &= ~S_ISVTX;
        }
    }


   


    /**
     * set up the class and the accessors for the user, group and other permissions
     *
     */
    constructor(permissions: number) {
        Object.defineProperty(this, 'permissions', {
            value: permissions || 0,
            configurable: true,
            writable: true,
        });

        // some magic to generate the code instead of duplicating ti many times.
        // the modifiers can be read and set using bitmasks as defined above.
        for (const [ action, base ] of this.permissionMap.entries()) {
            for (const [name, multiplier] of this.targetMap.entries()) {

                // generate the mask
                const modifier = base * multiplier;
                const target = name === 'user' ? this.user : name === 'group' ? this.group : this.other;

                // expose the property
                Object.defineProperty(target, action, {
                    configurable: true,
                    enumerable: true,

                    get: () : boolean => {
                        return Boolean(this.permissions & modifier);
                    },

                    set: (status: boolean) => {
                        if (status) {
                            this.permissions |= modifier;
                        } else {
                            this.permissions &= ~modifier;
                        }
                    },
                });
            }
        }    
    }



    /**
     * returns the mode
     *
     * @return     {number}  The mode.
     */
    getMode() {
        return this.permissions;
    }


    /**
     * Returns a string representation of the object.
     *
     * @return     {string}  String representation of the object.
     */
    toString() {
        const str = [];

        str.push(this.user.read ? 'r' : '-');
        str.push(this.user.write ? 'w' : '-');
        if (this.setuid) {
            str.push(this.user.execute ? 's' : 'S');
        } else {
            str.push(this.user.execute ? 'x' : '-');
        }

        // group read, write, execute
        str.push(this.group.read ? 'r' : '-');
        str.push(this.group.write ? 'w' : '-');
        if (this.setgid) {
            str.push(this.group.execute ? 's' : 'S');
        } else {
            str.push(this.group.execute ? 'x' : '-');
        }

        // others read, write, execute
        str.push(this.other.read ? 'r' : '-');
        str.push(this.other.write ? 'w' : '-');
        if (this.sticky) {
            str.push(this.other.execute ? 't' : 'T');
        } else {
            str.push(this.other.execute ? 'x' : '-');
        }

        return str.join('');
    }
}
