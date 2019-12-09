import section from 'section-tests';
import log from 'ee-log';
import assert from 'assert';
import SFTPServer from './lib/SFTPServer.js';
import SFTPClient from '../src/SFTPClient.js';



section('SFTP Client: stat', (section) => {
    let server;

    section.setup('starting the SFTP Server', async () => {
        server = new SFTPServer();
        await server.load();
        await server.listen();
    });



    section.test('Stat an existing file', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const stats = await client.stat('share/100-bytes.bin');

        assert(stats);
        assert(typeof stats === 'object');
        assert(stats.isFile());

        await client.end();
    });



    section.test('Stat a non existing file', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        let err;
        try {
            await client.stat('nope');
        } catch(e) {
            err = e;
        } finally {
            assert(err);
            assert.equal(err.message, `Failed to stat file 'nope': no such file!`);
        }

        await client.end();
    });



    section.destroy('stopping the SFTP Server', async () => {
        await server.end();
    });
});
