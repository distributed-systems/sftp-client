import section from 'section-tests';
import log from 'ee-log';
import assert from 'assert';
import SFTPServer from './lib/SFTPServer.js';
import SFTPClient from '../src/SFTPClient.js';
import crypto from 'crypto';


section('SFTP Client: move files & directories', (section) => {
    let server;

    section.setup('starting the SFTP Server', async () => {
        server = new SFTPServer();
        await server.load();
        await server.listen();
    });



    section.test('move a file', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        
        const writeStream = await client.createtWriteStream('/upload/move.me');

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


        await client.move('/upload/move.me', '/upload/moved.done');
        await client.end();
    });



    

    section.test('move a directory', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });


        await client.createDirectory('/upload/moveme/hui', true);
        await client.createDirectory('/upload/moveme/nope', true);
        

        const writeStream = await client.createtWriteStream('/upload/moveme/delete.me');

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

        
        await client.move('/upload/moveme', '/upload/moved');
        await client.end();
    });




    section.destroy('stopping the SFTP Server', async () => {
        await server.end();
    });
});
