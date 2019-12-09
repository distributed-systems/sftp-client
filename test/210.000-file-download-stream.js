import section from 'section-tests';
import log from 'ee-log';
import assert from 'assert';
import SFTPServer from './lib/SFTPServer.js';
import SFTPClient from '../src/SFTPClient.js';



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




    section.test('pausing and resuming the stream', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const readStream = await client.createReadStream('share/100-Kbytes.bin');
        const stats = await client.stat('share/100-Kbytes.bin');

        await new Promise((resolve, reject) => {
            let len = 0;
            let chunkCount = 0;


            readStream.on('data', (chunk) => {
                chunkCount++;

                // interrupt the stream
                if (len === 0) {
                    readStream.pause();

                    setTimeout(() => {
                        readStream.resume();
                    }, 1000);
                }

                len += chunk.length;
            });


            readStream.on('close', () => {
                if (len === stats.size) {
                    assert(chunkCount >= 2);

                    resolve();
                } else {
                    throw new Error(`buffer length is invalid, ${len} vs ${stats.size}!`);
                }
            });
        });

        await client.end();
    });





    section.test('the destroy method must emit the error event', async() => {
        // test added due to an invalid underlying library implementation:
        // issue: https://github.com/mscdex/ssh2-streams/issues/112
        

        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const readStream = await client.createReadStream('share/100-Kbytes.bin');

        await new Promise((resolve, reject) => {
            let err;

            readStream.on('data', () => {
                readStream.destroy(new Error('bad stuff happened!'));
            });

            readStream.on('error', (e) => {
                err = e;
            });


            readStream.on('close', () => {
                if (err && err.message === 'bad stuff happened!') resolve();
                else reject(new Error('The error event was not triggered by the destroy method call!'));
            });
        });

        await client.end();
    });



    section.destroy('stopping the SFTP Server', async () => {
        await server.end();
    });
});
