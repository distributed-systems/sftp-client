import section from 'section-tests';
import log from 'ee-log';
import assert from 'assert';
import SFTPServer from './lib/SFTPServer.js';
import SFTPClient, { Permissions } from '../src/SFTPClient.js';
import crypto from 'crypto';


section('SFTP Client: move files & directories', (section) => {
    let server;

    section.setup('starting the SFTP Server', async () => {
        server = new SFTPServer();
        await server.load();
        await server.listen();
    });



    section.test('set permissions', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        
        const writeStream = await client.createtWriteStream('/upload/change.permissions');

        const getBytes = (num) => {
            return new Promise((resolve, reject) => {
                crypto.randomBytes(num, (err, bytes) => {
                    if (err) reject(err);
                    else resolve(bytes);
                });
            });
        }

        const buffer = await getBytes(1000);
        writeStream.write(buffer);

        await new Promise((resolve, reject) => {
            writeStream.on('error', reject);
            writeStream.on('close', resolve);
            writeStream.end();
        });


        const permissions = new Permissions();
        permissions.user.execute = true;
        permissions.user.read = true;
        permissions.user.write = true;
        permissions.group.execute = true;
        permissions.group.read = true;
        permissions.group.write = true;
        permissions.other.execute = false;
        permissions.other.read = false;
        permissions.other.write = false;


        await client.setPermissions('/upload/change.permissions', permissions);

        const stats = await client.stat('/upload/change.permissions');
        
        assert(stats);
        assert.equal(stats.permissions.user.execute, true);
        assert.equal(stats.permissions.user.read, true);
        assert.equal(stats.permissions.user.write, true);
        assert.equal(stats.permissions.group.execute, true);
        assert.equal(stats.permissions.group.read, true);
        assert.equal(stats.permissions.group.write, true);
        assert.equal(stats.permissions.other.execute, false);
        assert.equal(stats.permissions.other.read, false);
        assert.equal(stats.permissions.other.write, false);

        await client.end();
    });




    section.destroy('stopping the SFTP Server', async () => {
        await server.end();
    });
});
