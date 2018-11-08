import section from 'section-tests';
import log from 'ee-log';
import assert from 'assert';
import SFTPServer from './lib/SFTPServer.mjs';
import SFTPClient from '../src/SFTPClient.mjs';
import crypto from 'crypto';


section('SFTP Client: up & download of big files', (section) => {
    let server;
    let checksum;
    let len = 0;
    const targetSize = 1.2 * 1000 * 1000 * 1000;


    section.setup('starting the SFTP Server', async () => {
        server = new SFTPServer();
        await server.load();
        await server.listen();
    });



    section.test(`write ${(targetSize / 1000000)} MB of random data`, async() => {
        section.setTimeout(60000);
        
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const writeStream = await client.createtWriteStream('upload/2GB.bin.upload');
        const sha = crypto.createHash('sha1');

        const getBytes = (num) => {
            return new Promise((resolve, reject) => {
                crypto.randomBytes(num, (err, bytes) => {
                    if (err) reject(err);
                    else resolve(bytes);
                });
            });
        }


        for (let i = 0, l = targetSize / 1000000; i < l; i++) {
            const buffer = await getBytes(1000000);
            sha.update(buffer);
            len += buffer.length;
            writeStream.write(buffer);
        }

        await new Promise((resolve, reject) => {
            writeStream.on('error', reject);
            writeStream.on('close', resolve);
            writeStream.end();
            checksum = sha.digest('hex');
        });

        await client.end();
    });





    section.test(`get ${(targetSize / 1000000)} MB file from sftp`, async() => {
        section.setTimeout(60000);
        
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        const readStream = await client.createReadStream('upload/2GB.bin.upload');
        const sha = crypto.createHash('sha1');


        await new Promise((resolve, reject) => {
            let dlLen = 0;

            readStream.on('error', reject);
            readStream.on('close', () => {
                const dlChecksum = sha.digest('hex');
                if (dlChecksum === checksum && len === dlLen && dlLen === targetSize) {
                    resolve();
                } else {
                    reject(new Error(`Checksum upload ${checksum} does not match the download checcksum ${dlChecksum}. Upload length: ${len}, download length ${dlLen}.`));
                }
            });

            readStream.on('data', (chunk) => {
                sha.update(chunk);
                dlLen += chunk.length;
            });
        });

        await client.end();
    });




    section.destroy('stopping the SFTP Server', async () => {
        await server.end();
    });
});
