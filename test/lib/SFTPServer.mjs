import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';


const { promises: { readFile } } = fs;



export default class SFTPServer {


    constructor() {
        this.dirname = path.dirname(new URL(import.meta.url).pathname);
        this.loaded = false;
        this.name = `sftp-test-server`;
        this.dockerImage = 'atmoz/sftp';
    }




    /**
     * load the keys from the file system
     *
     * @return     {Promise}  undefined
     */
    async load() {
        if (!this.loaded) {
            this.loaded = true;

            this.publicKeyPath = path.join(this.dirname, '../data/keys/id_rsa.pub');
            this.privateKeyPath = path.join(this.dirname, '../data/keys/id_rsa');

            this.publicKey = await readFile(this.publicKeyPath);
            this.privateKey = await readFile(this.privateKeyPath);

            // pull the docker image
            await this.exec(`docker pull ${this.dockerImage}`);

            await this.exec(`docker container stop ${this.name}`).catch(() => true);
        }
    }




    /**
     * start the server
     *
     * @param      {number}   port    The port
     * @return     {Promise}  undefined
     */
    async listen(port = 2222) {
        if (this.server) throw new Error(`Cannot open server, server was already started!`);

        const args = [
            'run',
            `--name ${this.name}`,
            `--rm`,
            `-v ${path.join(this.dirname, '../data/keys/ssh_host_ed25519_key')}:/etc/ssh/ssh_host_ed25519_key`,
            `-v ${path.join(this.dirname, '../data/keys/ssh_host_rsa_key')}:/etc/ssh/ssh_host_rsa_key`,
            `-v ${path.join(this.dirname, '../data/keys/id_rsa.pub')}:/home/foo/.ssh/keys/id_rsa.pub:ro`,
            `-v ${path.join(this.dirname, '../data/sftp-root')}:/home/foo/share`,
            `-p ${port}:22`,
            `atmoz/sftp`,
            `foo::1001::upload`,
        ].join(' ').split(/\s+/g);

        this.server = await this.run('docker', args);
    }




    /**
     * shut down the server
     *
     * @return     {Promise}  undefined
     */
    async end() {
        if (!this.server) throw new Error(`Cannot end server, the server was not yet started!`);
        await this.exec(`docker container stop ${this.name}`);
        this.server.kill();
    }




    /**
     * run a command
     *
     * @param      {string}   command  The command
     * @return     {Promise}  stdout & stderr
     */
    async exec(command) {
        return new Promise((resolve, reject) => {
            exec(command, (err, stdout, stderr) => {
                if (err) reject(err);
                else {
                    resolve({
                        stdout,
                        stderr,
                    });
                }
            });
        });
    }



    /**
     * spawna child process
     *
     * @param      {string}   command  The command
     * @param      {array}    args     The arguments
     * @return     {Promise}  the process handle
     */
    async run(command, args) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args);

            child.stdout.on('data', (data) => {
                //console.log('stdout', data.toString());
            });

            child.stderr.on('data', (data) => {
                //console.log('stderr', data.toString());
                if (data.toString().includes('Server listening on 0.0.0.0 port 22')) {
                    resolve(child);
                }
            });
        });
    }
};
