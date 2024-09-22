interface PermissionObject {
    read: boolean;
    write: boolean;
    execute: boolean;
}
export default class Permissions {
    permissions: number;
    private permissionMap;
    private targetMap;
    user: PermissionObject;
    group: PermissionObject;
    other: PermissionObject;
    get setuid(): boolean;
    set setuid(status: boolean);
    get setgid(): boolean;
    set setgid(status: boolean);
    get sticky(): boolean;
    set sticky(status: boolean);
    /**
     * set up the class and the accessors for the user, group and other permissions
     *
     */
    constructor(permissions: number);
    /**
     * returns the mode
     *
     * @return     {number}  The mode.
     */
    getMode(): number;
    /**
     * Returns a string representation of the object.
     *
     * @return     {string}  String representation of the object.
     */
    toString(): string;
}
export {};
//# sourceMappingURL=Permissions.d.ts.map