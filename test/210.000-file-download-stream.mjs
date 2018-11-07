import section from 'section-tests';
import log from 'ee-log';
import assert from 'assert';
import SFTPServer from './lib/SFTPServer.mjs';
import SFTPClient from '../src/SFTPClient.mjs';



section('SFTP Client: file stream download', (section) => {
    let server;

    section.setup('starting the SFTP Server', async () => {
        server = new SFTPServer();
        await server.load();
        await server.listen();
    });



    section.test('get a file stream', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const stream = await client.getReadStream('share/100-bytes.bin');
        assert(stream);

        await client.end();
    });



    section.test('get a file stream for a non existing file', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        

        let err;
        try {
            await client.getReadStream('nope');
        } catch(e) {
            err = e;
        } finally {
            assert(err);
            assert.equal(err.message, `Failed to create stream for file 'nope': no such file!`);
        }


        await client.end();
    });



    section.destroy('stopping the SFTP Server', async () => {
        await server.end();
    });
});
