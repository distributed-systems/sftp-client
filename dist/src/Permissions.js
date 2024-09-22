// code partially from  https://github.com/TooTallNate/stat-mode/blob/master/index.js
const S_ISUID = 2048; /* 0004000 set user id on execution */
const S_ISGID = 1024; /* 0002000 set group id on execution */
const S_ISVTX = 512; /* 0001000 save swapped text even after use */
export default class Permissions {
    get setuid() {
        return Boolean(this.permissions & S_ISUID);
    }
    set setuid(status) {
        if (status) {
            this.permissions |= S_ISUID;
        }
        else {
            this.permissions &= ~S_ISUID;
        }
    }
    get setgid() {
        return Boolean(this.permissions & S_ISGID);
    }
    set setgid(status) {
        if (status) {
            this.permissions |= S_ISGID;
        }
        else {
            this.permissions &= ~S_ISGID;
        }
    }
    get sticky() {
        return Boolean(this.permissions & S_ISVTX);
    }
    set sticky(status) {
        if (status) {
            this.permissions |= S_ISVTX;
        }
        else {
            this.permissions &= ~S_ISVTX;
        }
    }
    /**
     * set up the class and the accessors for the user, group and other permissions
     *
     */
    constructor(permissions) {
        this.permissionMap = new Map([
            ['read', 4],
            ['write', 2],
            ['execute', 1],
        ]);
        this.targetMap = new Map([
            ['user', 64],
            ['group', 8],
            ['other', 1],
        ]);
        this.user = { read: false, write: false, execute: false };
        this.group = { read: false, write: false, execute: false };
        this.other = { read: false, write: false, execute: false };
        Object.defineProperty(this, 'permissions', {
            value: permissions || 0,
            configurable: true,
            writable: true,
        });
        // some magic to generate the code instead of duplicating ti many times.
        // the modifiers can be read and set using bitmasks as defined above.
        for (const [action, base] of this.permissionMap.entries()) {
            for (const [name, multiplier] of this.targetMap.entries()) {
                // generate the mask
                const modifier = base * multiplier;
                const target = name === 'user' ? this.user : name === 'group' ? this.group : this.other;
                // expose the property
                Object.defineProperty(target, action, {
                    configurable: true,
                    enumerable: true,
                    get: () => {
                        return Boolean(this.permissions & modifier);
                    },
                    set: (status) => {
                        if (status) {
                            this.permissions |= modifier;
                        }
                        else {
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
        }
        else {
            str.push(this.user.execute ? 'x' : '-');
        }
        // group read, write, execute
        str.push(this.group.read ? 'r' : '-');
        str.push(this.group.write ? 'w' : '-');
        if (this.setgid) {
            str.push(this.group.execute ? 's' : 'S');
        }
        else {
            str.push(this.group.execute ? 'x' : '-');
        }
        // others read, write, execute
        str.push(this.other.read ? 'r' : '-');
        str.push(this.other.write ? 'w' : '-');
        if (this.sticky) {
            str.push(this.other.execute ? 't' : 'T');
        }
        else {
            str.push(this.other.execute ? 'x' : '-');
        }
        return str.join('');
    }
}
//# sourceMappingURL=Permissions.js.map