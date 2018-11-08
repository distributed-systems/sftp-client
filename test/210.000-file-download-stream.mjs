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

        const stream = await client.createReadStream('share/100-bytes.bin');
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
            await client.createReadStream('nope');
        } catch(e) {
            err = e;
        } finally {
            assert(err);
            assert.equal(err.message, `Failed to create stream for file 'nope': no such file!`);
        }


        await client.end();
    });




    section.test('get a file stream for a text file containing multibyte characters', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const readStream = await client.createReadStream('share/multibyte-characters.txt');


        await new Promise((resolve, reject) => {
            let buffer;

            readStream.on('data', (chunk) => {
                if (buffer) buffer = Buffer.concat([buffer, chunk]);
                else buffer = chunk;
            });

            readStream.on('close', () => {
                if (buffer.length === 1300000) resolve();
                else {
                    throw new Error(`buffer length is invalid, ${buffer.length} vs 1300000!`);
                }
            });
        });

        await client.end();
    });



    section.destroy('stopping the SFTP Server', async () => {
        await server.end();
    });
});
