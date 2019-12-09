import section from 'section-tests';
import log from 'ee-log';
import assert from 'assert';
import SFTPServer from './lib/SFTPServer.js';
import SFTPClient from '../src/SFTPClient.js';
import crypto from 'crypto';


section('SFTP Client: delete directories', (section) => {
    let server;

    section.setup('starting the SFTP Server', async () => {
        server = new SFTPServer();
        await server.load();
        await server.listen();
    });



    section.test('delete an empty directory', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        await client.createDirectory('/upload/deleteme');
        await client.deleteDirectory('/upload/deleteme');
        await client.end();
    });



    section.test('delete a directory with files in it', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });


        await client.createDirectory('/upload/deleteme-2/hui', true);
        await client.createDirectory('/upload/deleteme-2/nope', true);
        

        const writeStream = await client.createtWriteStream('/upload/deleteme-2/delete.me');

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


        await client.deleteDirectory('/upload/deleteme-2', true);
        await client.end();
    });



    

    section.test('delete a directory with files in it, non recursively', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });


        await client.createDirectory('/upload/deleteme-3/hui', true);
        await client.createDirectory('/upload/deleteme-3/nope', true);
        

        const writeStream = await client.createtWriteStream('/upload/deleteme-3/delete.me');

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


         let err;
        try {
            await client.deleteDirectory('/upload/deleteme-3');
        } catch (e) {
            err = e;
        } finally {
            assert(err);
            assert.equal(err.message, `Cannot delete directory '/upload/deleteme-3': it contains files!`);
        }

        
        await client.end();
    });




    section.destroy('stopping the SFTP Server', async () => {
        await server.end();
    });
});
