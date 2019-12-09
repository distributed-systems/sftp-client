import section from 'section-tests';
import log from 'ee-log';
import assert from 'assert';
import SFTPServer from './lib/SFTPServer.js';
import SFTPClient from '../src/SFTPClient.js';


section('SFTP Client: create directory', (section) => {
    let server;

    section.setup('starting the SFTP Server', async () => {
        server = new SFTPServer();
        await server.load();
        await server.listen();
    });



    section.test('create a directory', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        await client.createDirectory('upload/testdir');
        await client.end();
    });



    section.test('create a path', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        await client.createDirectory('upload/testdir-2/subdir/sub-subdir', true);
        await client.end();
    });



    section.test('create a path, non recursive', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        let err;
        try {
            await client.createDirectory('upload/some/subdir/sub-subdir');
        } catch (e) {
            err = e;
        } finally {
            assert(err);
            assert(err.message.startsWith(`Cannot create directory 'upload/some/subdir/sub-subdir', the parent directory`));
        }

        await client.end();
    });



    section.test('create an existing directory', async() => {
        const client = new SFTPClient();
        await client.connect({
            hostname: 'l.dns.porn',
            port: 2222,
            username: 'foo',
            privateKey: server.privateKey,
        });

        let err;
        try {
            await client.createDirectory('upload');
        } catch (e) {
            err = e;
        } finally {
            assert(err);
            assert(err.message.startsWith(`Cannot create directory 'upload'`));
        }

        await client.end();
    });



    section.destroy('stopping the SFTP Server', async () => {
        await server.end();
    });
});
