import sourceMapSupport from 'source-map-support';
import logd from 'logd';
import ConsoleTransport from 'logd-console-transport';
import SFTPClient from './index.js';
import * as fs from 'node:fs';

// enable source map support
sourceMapSupport.install();

// enable console logging
logd.transport(new ConsoleTransport());


(async () => {
    const client = new SFTPClient();
    
    await client.connect({
        hostname: 'localhost',
        port: 22,
        username: 'lina',
        privateKey: fs.readFileSync('/home/lina/.ssh/id_rsa').toString(),
    });

    await client.list('/home/lina');
    await client.getFile('/home/lina/test.txt');
    await client.exists('/home/lina/test.txt');
    const stats = await client.stat('/home/lina/test.txt');
    console.log(stats, stats.permissions.user.read, stats.permissions.group.write, stats.permissions.other.execute, stats.permissions.toString());
})().catch((err) => {
    console.error(err);
});