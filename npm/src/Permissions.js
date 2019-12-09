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



export default class Permissions {

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
     * @param      {number}  permissions  The permissions
     */
    constructor(permissions) {
        Object.defineProperty(this, 'permissions', {
            value: permissions || 0,
            configurable: true,
            writable: true,
        });

        this.user = {};
        this.group = {};
        this.other = {};


        // some magic to generate the code instead of duplicating ti many times.
        // the modifiers can be read and set using bitmasks as defined above.
        for (const [base, action ] of [ [ 1, 'execute' ], [ 2, 'write' ], [ 4, 'read' ]]) {
            for (const [name, multiplier] of [ [ 'other', 1 ], [ 'group', 8 ], [ 'user', 64 ] ]) {

                // generate the mask
                const modifier = base * multiplier;

                // expose the property
                Object.defineProperty(this[name], action, {
                    configurable: true,
                    enumerable: true,

                    get: () => {
                        return Boolean(this.permissions & modifier);
                    },

                    set: (status) => {
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

        str.push(this.owner.read ? 'r' : '-');
        str.push(this.owner.write ? 'w' : '-');
        if (this.setuid) {
            str.push(this.owner.execute ? 's' : 'S');
        } else {
            str.push(this.owner.execute ? 'x' : '-');
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
        str.push(this.others.read ? 'r' : '-');
        str.push(this.others.write ? 'w' : '-');
        if (this.sticky) {
            str.push(this.others.execute ? 't' : 'T');
        } else {
            str.push(this.others.execute ? 'x' : '-');
        }

        return str.join('');
    }
}
