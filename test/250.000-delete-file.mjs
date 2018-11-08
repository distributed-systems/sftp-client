import section from 'section-tests';
import log from 'ee-log';
import assert from 'assert';
import SFTPServer from './lib/SFTPServer.mjs';
import SFTPClient from '../src/SFTPClient.mjs';
import crypto from 'crypto';


section('SFTP Client: delete file', (section) => {
    let server;

    section.setup('starting the SFTP Server', async () => {
        server = new SFTPServer();
        await server.load();
        await server.listen();
    });



    section.test('delete a file', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });


        const writeStream = await client.createtWriteStream('upload/delete.me');

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



        await client.deleteFile('upload/delete.me');
        await client.end();
    });



    section.test('delete a directory', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });


        let err;
        try {
            await client.deleteFile('upload');
        } catch (e) {
            err = e;
        } finally {
            assert(err);
            assert.equal(err.message, `Cannot delete file 'upload': path is a directory!`);
        }
        
        await client.end();
    });




    section.test('delete a non existing file', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });


        let err;
        try {
            await client.deleteFile('upload/nope');
        } catch (e) {
            err = e;
        } finally {
            assert(err);
            assert.equal(err.message, `Cannot delete file 'upload/nope': it does not exist!`);
        }

        await client.end();
    });




    section.destroy('stopping the SFTP Server', async () => {
        await server.end();
    });
});
