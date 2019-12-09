import section from 'section-tests';
import log from 'ee-log';
import assert from 'assert';
import SFTPServer from './lib/SFTPServer.js';
import SFTPClient from '../src/SFTPClient.js';
import fs from 'fs';
import path from 'path';



section('SFTP Client: file stream upload', (section) => {
    let server;

    section.setup('starting the SFTP Server', async () => {
        server = new SFTPServer();
        await server.load();
        await server.listen();
    });



    section.test('get a file put stream', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const writeStream = await client.createtWriteStream('upload/100-bytes.bin.upload');
        assert(writeStream);

        const sourceFile = path.join(path.dirname(new URL(import.meta.url).pathname), 'data/sftp-root/100-bytes.bin');
        const readStream = fs.createReadStream(sourceFile);

        await new Promise((resolve, reject) => {
            writeStream.on('error', reject);
            writeStream.on('close', resolve);

            readStream.pipe(writeStream);
        });

    
        await client.end();
    });




    section.test('get a file put stream, try to write in a directory without appropriate permissions', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const writeStream = await client.createtWriteStream('100-bytes.bin.upload');
        assert(writeStream);

        const sourceFile = path.join(path.dirname(new URL(import.meta.url).pathname), 'data/sftp-root/100-bytes.bin');
        const readStream = fs.createReadStream(sourceFile);

        await new Promise((resolve, reject) => {
            writeStream.on('error', (err) => {
                assert(err);
                assert.equal(err.message, `Failed to create a write stream for the file '100-bytes.bin.upload': Permission denied`);
                resolve();
            });

            writeStream.on('close', reject);

            readStream.pipe(writeStream);
        });

    
        await client.end();
    });


    section.destroy('stopping the SFTP Server', async () => {
        await server.end();
    });
});
