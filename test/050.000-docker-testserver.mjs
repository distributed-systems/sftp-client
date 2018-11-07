import section from 'section-tests';
import log from 'ee-log';
import SFTPServer from './lib/SFTPServer.mjs';




section('Docker SFTP Server', (section) => {
    section.test('Instantiate the Server', async() => {
        new SFTPServer();
    });


    section.test('Start & stop the Server', async() => {
        section.setTimeout(10000);

        const server = new SFTPServer();

        section.info(`loading sshd server`);
        await server.load();

        section.info(`starting sshd server`);
        await server.listen();

        section.info(`stopping sshd server`);
        await server.end();
    });
});
