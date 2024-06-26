const { equal, deepEqual } = require('node:assert');
const { describe, it, before } = require('node:test');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const { readFileSync, existsSync, statSync } = require('node:fs');

const {
    initWorkflow,
    executeTask,
    registerTask,
    Task,
    TaskState,
} = require('../dist/task');
require('../dist/internal');

describe('task', () => {
    describe('基础流程', () => {
        before(() => {
            // 初始化工作流
            initWorkflow({
                entry: '.test.config.js',
                params: {
                    testA: true,
                    testB: true,
                },
                cacheFile: join(__dirname, './task/.dist.cache.json'),
                cacheDir: join(__dirname, './task/.dist-files'),
                workspaces: [
                    join(__dirname, './task/workspace-a'),
                    join(__dirname, './task/workspace-b'),
                ],
            });

            // 注册测试任务
            class TestTask extends Task {
                // eslint-disable-next-line class-methods-use-this
                getTitle() {
                    return '测试任务';
                }

                // eslint-disable-next-line class-methods-use-this
                execute() {
                    return TaskState.success;
                }
            }
            registerTask('test', TestTask);
        });

        it('执行任务', async () => {
            const results = await executeTask([
                'test',
            ]);
            equal(true, !!results.test);
            equal(TaskState.success, results.test[0]);
            equal(TaskState.success, results.test[1]);
        });
    });

    // describe('nested', () => {});

    describe('chmod', () => {
        const baseDir = join(__dirname, './task/workspace-chmod');
        const PATH = {
            txt: join(baseDir, './.dist/test.txt'),
            result: join(baseDir, './.dist/result.json'),
        };

        before(() => {
            spawnSync('node', [join(baseDir, './run.js')]);
        });

        it('检查修改后的文件权限', async () => {
            const stats = statSync(PATH.txt);
            equal(511, stats.mode & 511);
        });
    });

    describe('download', () => {
        const baseDir = join(__dirname, './task/workspace-download');
        const PATH = {
            svg: join(baseDir, './.dist/groups.svg'),
            result: join(baseDir, './.dist/result.json'),
        };

        before(() => {
            spawnSync('node', [join(baseDir, './run.js')]);
        });

        it('检查运行结果', async () => {
            equal(true, existsSync(PATH.svg));
            equal(true, existsSync(PATH.svg + '_backup'));
            equal(false, existsSync(PATH.svg + '_backup2'));
            equal(true, existsSync(PATH.svg + '_backup3'));
        });
    });

    describe('file', () => {
        const baseDir = join(__dirname, './task/workspace-file');
        const PATH = {
            cache: join(baseDir, './.dist/cache.json'),
            result: join(baseDir, './.dist/result.json'),
        };

        before(() => {
            spawnSync('node', [join(baseDir, './run.js')]);
        });

        it('检查缓存信息', async () => {
            const cacheStr = readFileSync(PATH.cache, 'utf8');
            const cacheJSON = JSON.parse(cacheStr);
            equal(true, !!cacheJSON.file);
        });

        it('检查运行结果', async () => {
            const cacheStr = readFileSync(PATH.result, 'utf8');
            const cacheJSON = JSON.parse(cacheStr);
            deepEqual({
                file: ['success'],
            }, cacheJSON);
            equal(true, existsSync(join(baseDir, './.dist/test-1')));
            equal(true, existsSync(join(baseDir, './.dist/test-1/a-dist')));
            equal(true, existsSync(join(baseDir, './.dist/test-1/a-dist/a')));
            equal(true, existsSync(join(baseDir, './.dist/test-1/b')));
            equal(true, existsSync(join(baseDir, './.dist/test-2')));
            equal(false, existsSync(join(baseDir, './.dist/test-2/a-dist')));
            equal(false, existsSync(join(baseDir, './.dist/test-2/a-dist/a')));
            equal(true, existsSync(join(baseDir, './.dist/test-2/b')));
        });
    });

    describe('less', () => {
        const baseDir = join(__dirname, './task/workspace-less');
        const PATH = {
            cache: join(baseDir, './.dist/cache.json'),
            result: join(baseDir, './.dist/result.json'),
        };

        before(() => {
            spawnSync('node', [join(baseDir, './run.js')]);
        });

        it('检查缓存信息', async () => {
            const cacheStr = readFileSync(PATH.cache, 'utf8');
            const cacheJSON = JSON.parse(cacheStr);
            equal(true, !!cacheJSON.less);
        });

        it('检查运行结果', async () => {
            const cacheStr = readFileSync(PATH.result, 'utf8');
            const cacheJSON = JSON.parse(cacheStr);
            deepEqual({
                less: ['success'],
            }, cacheJSON);
            equal(true, existsSync(join(baseDir, './.dist/test.css')));
        });
    });

    // describe('npm', () => {
    //     const baseDir = join(__dirname, './task/workspace-npm');
    //     const PATH = {
    //         txt: join(baseDir, './.dist/test.txt'),
    //         result: join(baseDir, './.dist/result.json'),
    //     };

    //     before(() => {
    //         spawnSync('node', [join(baseDir, './run.js')]);
    //     });

    //     it('检查修改后的文件权限', async () => {
    //         const stats = statSync(PATH.txt);
    //         equal(511, stats.mode & 511);
    //     });
    // });

    // describe('remove', () => {});

    describe('repo', () => {
        const baseDir = join(__dirname, './task/workspace-repo');
        const PATH = {
            repo: join(baseDir, './.dist/repository'),
            cache: join(baseDir, './.dist/cache.json'),
            result: join(baseDir, './.dist/result.json'),
        };

        before(() => {
            spawnSync('node', [join(baseDir, './run.js')]);
        });

        it('检查仓库文件夹', async () => {
            const exists = existsSync(PATH.repo);
            equal(true, exists);
        });

        it('检查缓存信息', async () => {
            const cacheStr = readFileSync(PATH.cache, 'utf8');
            const cacheJSON = JSON.parse(cacheStr);
            deepEqual({}, cacheJSON);
        });

        it('检查运行结果', async () => {
            const cacheStr = readFileSync(PATH.result, 'utf8');
            const cacheJSON = JSON.parse(cacheStr);
            deepEqual({
                repo: ['success'],
            }, cacheJSON);
        });
    });

    describe('tsc', () => {
        const baseDir = join(__dirname, './task/workspace-tsc');
        const PATH = {
            cache: join(baseDir, './.dist/cache.json'),
            result: join(baseDir, './.dist/result.json'),
        };

        before(() => {
            spawnSync('node', [join(baseDir, './run.js')]);
        });

        it('检查缓存信息', async () => {
            const cacheStr = readFileSync(PATH.cache, 'utf8');
            const cacheJSON = JSON.parse(cacheStr);
            equal(true, !!cacheJSON.tsc);
        });

        it('检查运行结果', async () => {
            const cacheStr = readFileSync(PATH.result, 'utf8');
            const cacheJSON = JSON.parse(cacheStr);
            deepEqual({
                tsc: ['success'],
            }, cacheJSON);
        });
    });
});
