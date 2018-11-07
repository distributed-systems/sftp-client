import section from 'section-tests';
import log from 'ee-log';
import assert from 'assert';
import SFTPServer from './lib/SFTPServer.mjs';
import SFTPClient from '../src/SFTPClient.mjs';



section('SFTP Client: file download', (section) => {
    let server;

    section.setup('starting the SFTP Server', async () => {
        server = new SFTPServer();
        await server.load();
        await server.listen();
    });



    section.test('get a file', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const buffer = await client.getFile('share/100-bytes.bin');
        assert(buffer);
        assert.equal(buffer.length, 100);

        await client.end();
    });



    section.test('get a file for a non existing path', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        

        let err;
        try {
            await client.getFile('nope');
        } catch(e) {
            err = e;
        } finally {
            assert(err);
            assert.equal(err.message, `Failed to create stream for file 'nope': no such file!`);
        }


        await client.end();
    });



    section.test('get a big file', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const buffer = await client.getFile('share/100-Kbytes.bin');
        assert(buffer);
        assert.equal(buffer.length, 102400);

        await client.end();
    });



    section.test('get a big text file', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const buffer = await client.getFile('share/100-Kbytes.txt');
        assert(buffer);
        assert.equal(buffer.length, 100000);

        await client.end();
    });



    section.destroy('stopping the SFTP Server', async () => {
        await server.end();
    });
});
