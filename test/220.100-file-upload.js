import section from 'section-tests';
import log from 'ee-log';
import assert from 'assert';
import SFTPServer from './lib/SFTPServer.js';
import SFTPClient from '../src/SFTPClient.js';
import fs from 'fs';
import path from 'path';


section('SFTP Client: file upload', (section) => {
    let server;

    section.setup('starting the SFTP Server', async () => {
        server = new SFTPServer();
        await server.load();
        await server.listen();
    });



    section.test('put a file', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const sourceFile = path.join(path.dirname(new URL(import.meta.url).pathname), 'data/sftp-root/100-bytes.bin');
        const buffer = await fs.promises.readFile(sourceFile);

        await client.putFile('upload/100-bytes.bin.upload-file', buffer);
        await client.end();
    });



    section.test('put a to an existing file', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const sourceFile = path.join(path.dirname(new URL(import.meta.url).pathname), 'data/sftp-root/100-bytes.bin');
        const buffer = await fs.promises.readFile(sourceFile);

        await client.putFile('upload/100-bytes.bin.upload-file', buffer);
        await client.end();
    });





    section.destroy('stopping the SFTP Server', async () => {
        await server.end();
    });
});
