import section from 'section-tests';
import log from 'ee-log';
import assert from 'assert';
import SFTPServer from './lib/SFTPServer.js';
import SFTPClient from '../src/SFTPClient.js';



section('SFTP Client: exists', (section) => {
    let server;

    section.setup('starting the SFTP Server', async () => {
        server = new SFTPServer();
        await server.load();
        await server.listen();
    });



    section.test('exists on an existing file', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const exists = await client.exists('share/100-bytes.bin');
        assert.equal(exists, true);

        await client.end();
    });



    section.test('exists a non existing file', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const exists = await client.exists('nope');
        assert.equal(exists, false);

        await client.end();
    });




    section.test('exists on an existing directory', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const exists = await client.exists('share');
        assert.equal(exists, true);

        await client.end();
    });



    section.destroy('stopping the SFTP Server', async () => {
        await server.end();
    });
});
