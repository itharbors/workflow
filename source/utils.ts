import {
    Stats, stat, readdir, existsSync, mkdirSync, mkdir,
    MakeDirectoryOptions,
} from 'fs';
import { join } from 'path';
import { spawn, SpawnOptionsWithoutStdio, spawnSync } from 'child_process';

/**
 * 循环传入的文件/文件夹里所有的文件/文件夹
 * @param path
 * @param handle
 * @returns
 */
export async function forEachFiles(path: string, handle: (file: string, fileStat: Stats) => void) {
    return new Promise((resolve, reject) => {
        stat(path, (error, fileStat) => {
            if (error) {
                return reject();
            }
            handle(path, fileStat);
            if (fileStat.isDirectory()) {
                readdir(path, async (dirError, names) => {
                    if (dirError) {
                        return reject();
                    }
                    for (const name of names) {
                        await forEachFiles(join(path, name), handle);
                    }
                    resolve(undefined);
                    return undefined;
                });
            } else {
                resolve(undefined);
            }
            return undefined;
        });
    });
}

/**
 * 执行一个 bash 命令
 * @param cmd
 * @param args
 * @param options
 * @returns
 */
export async function bash(
    cmd: string,
    args: string[],
    options: SpawnOptionsWithoutStdio,
    handle?: (data: Buffer) => void,
) {
    return new Promise((resolve, reject) => {
        if (process.platform === 'win32' && !cmd.endsWith('.cmd')) {
            const str = spawnSync('where', [cmd]).stdout.toString();
            if (str.includes('.cmd')) {
                // eslint-disable-next-line no-param-reassign
                cmd += '.cmd';
            }
        }
        if (options.cwd && !existsSync(options.cwd)) {
            mkdirSync(options.cwd);
        }
        const child = spawn(cmd, args, options);
        if (child.stdout) {
            child.stdout.on('data', (data) => {
                if (handle) {
                    handle(data);
                } else {
                    console.log(`${data}`);
                }
            });
        }
        if (child.stderr) {
            child.stderr.on('data', (data) => {
                if (handle) {
                    handle(data);
                } else {
                    console.log(`${data}`);
                }
            });
        }
        child.on('close', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error('Exit code not equal to 0'));
            }
        });
        child.on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * Formats the given time value.
 *
 * @param {number} time - The time value to be formatted.
 * @return {void} This function does not return any value.
 */
export function formatTime(time: number) {
    if (time < 10000) {
        return `${(`${time}ms`).padStart(6, ' ')}`;
    } if (time < 100000000) {
        return `${(`${time / 1000}s `).padStart(6, ' ')}`;
    }
    return `${(`${time}ms`).padStart(6, ' ')}`;
}

/**
 * 打印
 * @param str
 */
export function print(str: string | Buffer | Error) {
    try {
        const trimStr = (`${str}`).trim();
        if (trimStr) {
            console.log(trimStr);
        }
    } catch (error) { /** ignore */ }
}

/**
 * 打印空行
 */
export function printEmpty() {
    console.log(' ');
}

const getMode = (options: MakeDirectoryOptions) => {
    const defaults = { mode: 0o777 };
    if (typeof options === 'number') return options;
    return ({ ...defaults, ...options }).mode;
};

/**
 * 创建目录
 * @param dir
 * @param options
 * @returns
 */
export async function makeDir(dir: string, options: MakeDirectoryOptions = {}) {
    return new Promise((resolve, reject) => {
        mkdir(dir, {
            mode: getMode(options),
            recursive: true,
        }, (error) => {
            if (error) {
                return reject(error);
            }
            return resolve(undefined);
        });
    });
}
