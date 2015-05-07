var fs = require('fs'),
    path = require('path'),
    request = require('request'),
    async = require('async'),
    colors = require('colors'),
    targz = require('tar.gz'),
    readline = require('readline'),
    fsUtil = require('./fs-util');

// 下载地址 http://ued.qunar.com/mobile/source/yo/';
var BASE_URL = 'http://localhost:4369/test/lili/';

var buildVersion = '1.0.1';
// 默认安装目录
//var yoWidgets = 'yo/';

// 配置目录 需要压缩上传的目录
var infoFile = 'lib/';
    infoFile = 'yo/';
// 配置目录版本信息文件
var versionFile = 'core/variables.scss';
    versionFile = 'lib/core/variables.scss';
// 配置文件
var yoConfigFile = "yo.config";
// 上传路径
var uploadurl = 'http://localhost:4369/upload?path=test/lili';
// 服务器端配置文件
var sourceConfigFile = BASE_URL + yoConfigFile;

var log = console.log;
var success = function(msg) {
    log(msg.green);
};
var error = function(msg) {
    log(msg.red);
};
var warn = function(msg) {
    log(msg.yellow);
}
var info = function(msg) {
    log(msg.cyan);
}

// 满足semver的语义化版本规则
function checkVersion(version) {
    return /^\d+\.\d+\.\d+$/.test(version);
}
// 版本比较
function compareVersion(oldVersion, newVersion) {
    var reg = /(\d+)\.(\d+)\.(\d+)/;
    var oldArr = oldVersion.match(reg),
        newArr = newVersion.match(reg);
    if(+newArr[1] > +oldArr[1]) {
        return true;
    } else if(+newArr[2] > +oldArr[2]) {
        if(+newArr[1] == +oldArr[1]) {
            return true;
        } else {
            return false;
        }
    } else if(+newArr[3] > +oldArr[3]) {
        if(+newArr[1] == +oldArr[1] && +newArr[2] == +oldArr[2]) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// 显示构建工具版本信息
function showVersion() {
    log('yobuild v' + buildVersion);
}
/**
 * Yo 库发布
 *
 * @root 命令执行的根路径
 * 开发者使用
 *
 */
function publish(root) {
    //判断当前目录下 yo目录是否存在
    if(!fs.existsSync(infoFile)) {
        error('打包目录' + infoFile + '不存在');
        return;
    }
    // core/.scss
    var versionpath = root + "/" + infoFile + versionFile ;
    if(!fs.existsSync(versionpath)) {
        error('版本文件' + versionpath + '不存在');
        return;
    }
    var version;
    var sourceVersion;
    var data = fs.readFileSync(versionpath,'utf8');
    var dataarr = data.split('\n');
    dataarr.forEach(function(dataarr) {
        if( dataarr.indexOf('version') > -1) {
            version =  (dataarr.split(':')[1]).match(/\"(.*)\"/)[1];
            return;
        }
    })

    //检测服务器 yo.config 是否存在 存在比较版本号 不存在 直接上传
    request(sourceConfigFile, function(err, res, body) {
            if (!err && res.statusCode === 200) {
                try {
                    var tmpdata= JSON.parse(body);
                    sourceVersion = tmpdata.version;
                    if(version === sourceVersion) {
                        error('当前打包版本' + version + ' 与服务器最新版本一样！');
                            return;
                    }else{
                        if(!compareVersion(sourceVersion, version)) {
                            error('当前打包版本 ' + version + '小于服务器最新版本号！');
                            return;
                        }
                        createTmpDir(root,version);
                         //得到 yo.config文件  压缩 yo 包
                        compressData(infoFile,version,root);
                    }
                } catch (e) {
                    error('版本配置文件解析失败。');
                    return;
                }
            } else {
               //error('版本配置文件下载失败！');
                createTmpDir(root,version);
                compressData(infoFile,version,root);
            }
        });
}
// 创建临时文件
function createTmpDir(root,version) {
    if(!fs.existsSync('./tmp/')) {
        fs.mkdirSync('./tmp/');
    }
    var localConfigFile = path.join(root,'./tmp/' + yoConfigFile)
    //检测本地是否有yo.config文件  有则写入当前版本号  无则创建并写入当前版本号
    checkLocalConfig(localConfigFile,version);
}
// 检查本地是否有yo.config 文件
function checkLocalConfig(localConfigFile,version) {
    var tempAccount = {
                "version" : version,
                "desc": "yo 版本号",
                "auth": ""
            };
    fs.writeFile(localConfigFile,JSON.stringify(tempAccount),function(err) {
        if(err) {
            log('写文件' + localConfigFile + '操作失败,请重新发布');
        }
    })
}
// 发布进度
function uploadProcess(successNum,version,path) {

    if(successNum >= 2) {
        success('版本' + version + '发布成功!');
        rmNoEmptydir(path);
    }
    else{
        info('打包中......');
        info(successNum + '个文件打包成功，共2个文件');
    }

}
// 删除非空目录
function rmNoEmptydir(path) {
    var folder_exists = fs.existsSync(path);
    if(folder_exists == true)
    {
          var dirList = fs.readdirSync(path);

          dirList.forEach(function(fileName)
          {
              fs.unlinkSync(path + fileName);
         });
     }
    fs.rmdir(path);
}
// 压缩并发布文件
function compressData(infoFile,version,root) {

    new targz().compress(infoFile, root + '/tmp/yo@' + version + '.map', function(err) {
        if (err) {
            error('版本' + version + '压缩失败,请重试');
        }
        else{
            var successNum = 0;
            //上传 yo 目录
            request.post({
                url: uploadurl,
                formData: {
                    file:fs.createReadStream(path.join(root, '/tmp/yo@' + version + '.map'))
                }
            }, function(err, res, body) {
                if (err) {
                    error(err);
                } else {
                    if(res.statusCode == 200)
                    {
                        //success('yo@' + version + '.map 文件发布成功');
                        successNum ++;
                        uploadProcess(successNum,version, root + '/tmp/');
                    }
                }
            });

            //上传 config 文件
            request.post({
                url: uploadurl,
                formData: {
                    file: fs.createReadStream(path.join(root, '/tmp/' + yoConfigFile))
                }
            }, function(err, res, body) {
                if (err) {
                    error(err);
                } else {
                    if(res.statusCode == 200)
                    {
                        //success(yoConfigFile + '文件发布成功');
                        successNum++;
                        uploadProcess(successNum,version, root + '/tmp/');
                    }
                }
            });
        }
    });
}

/**
 * Yo 库安装
 *
 * @root 命令执行的根路径
 * @source Yo的根路径
 * 默认安装整个yo目录文件
 */

function install(installPath,version) {
    //log(version);
    if(version != true) {
        tarFile = BASE_URL + 'yo@' +  version + '.map';
        //log('tarFile = '+ tarFile);
        existInstall(tarFile, installPath);
    }
    else{
        //log(sourceConfigFile);
        request(sourceConfigFile, function(err, res, body) {
            if (res.statusCode === 200) {
                var tmpdata= JSON.parse(body);
                tarFile = BASE_URL + 'yo@' +  tmpdata.version + '.map';
               // log('basetarFile = '+ tarFile);
                existInstall(tarFile, installPath);
            } else {
                error(sourceConfigFile + ' 解析失败！');
            }
        });
    }
}

// 判断当前目录下 yo 文件是否存在
function existInstall(tarFile,installPath) {
    // log(installPath);
    // log(installPath + '/' + infoFile);
    // log('installPath=' + fs.existsSync(installPath));

    // if(!fs.existsSync(installPath)){
    //     fs.mkdir(installPath,function(err){
    //         log('dsfsd'+err);
    //     });

    // }

    if(fs.existsSync(installPath + '/' + infoFile)) {
        var rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        var question = '本地已存在' + infoFile + '是否替换Y/N: ';
        //log(question);
        rl.question(question.yellow, function(answer) {
            if(answer == "N") {
               process.exit (1);
            }
            else {

                fsUtil.rmDirSync(installPath + '/' + infoFile);
                extractData(tarFile, installPath);
                rl.close();
            }
        });
    }else {
        extractData(tarFile, installPath);
    }
}

function extractData(tarFile,installPath) {
    request({
        url: tarFile,
        encoding: null
    },function (err, res, body) {
        if (!err && res.statusCode === 200) {

            // 创建写入临时文件夹
            if(!fs.existsSync('./tmp')){
                fs.mkdirSync('./tmp');
            }

            //tmpPath = './tmp/yo.tar.gz';
            tmpPath = './tmp/yo.map';
            fs.writeFileSync(tmpPath, body);
           // log(installPath);
            //解压
            new targz().extract(tmpPath, installPath, function(err) {
                //log(err);
                if(err) {
                    error('安装失败');
                }else{
                    success('安装成功');
                    fsUtil.rmDirSync('./tmp/');
                }
            });
        }
        else
        {
            error(tarFile + '解析失败，请确认是否存在此版本号文件');
        }
    })
}


/**
 * Yo库更新
 *
 * @root 命令执行的根路径
 * @source Yo的根路径
 * 默认安装整个yo目录文件
 */

function updateDate(tarFile,installPath){
    //log(tarFile);
    request({
        url: tarFile,
        encoding: null
    }, function(err, res, body){
        if(!err && res.statusCode === 200) {
              // 创建写入临时文件夹
            if(!fs.existsSync('./tmp')){
                fs.mkdirSync('./tmp');
            }
            tmpPath = './tmp/yo.tar.gz';
            fs.writeFileSync(tmpPath, body);
            //log(fs.existsSync('./tmp/yo.tar.gz'));
            //解压
            new targz().extract(tmpPath, './tmp' , function(err) {
                //log(err);
                if(!err) {
                    if(fs.existsSync('./tmp/yo/lib/')){
                        var newpath = installPath+'/yo/lib/';
                            newpath = path.join(installPath , '/yo/lib');
                            // log(newpath);
                            // log(fs.existsSync(newpath));
                        if(fs.existsSync(newpath)){
                            fsUtil.rmDirSync(newpath);
                        }
                        fs.rename('./tmp/yo/lib/',newpath ,function(err){
                            //log(err);
                             if(err){
                                 error('更新失败');
                             }else{
                                 success('更新成功');
                                 fsUtil.rmDirSync('./tmp/');
                             }
                        });
                    };
                }else{
                    error('文件解析失败！');
                }

            });
        }
    });
}

/**
 * Yo 库更新
 *
 * @root 命令执行的根路径
 * @source Yo的根路径  默认更新当前文件夹
 * 默认更新yo/lib目录文件
 */
function update(installPath,version) {
    //判断当前目录下 yo目录是否存在
    if(!fs.existsSync(infoFile)) {
        error(installPath + " 下还未安装yo,请检查需更新目录！");
    }else {
        // error('已存在' + infoFile);
        if(version != true) {
            tarFile = BASE_URL + 'yo@' +  version + '.map';
            //log('tarFile = '+ tarFile);
            updateDate(tarFile, installPath);
        }
        else{
            //log(sourceConfigFile);
            request(sourceConfigFile, function(err, res, body) {
                if (res.statusCode === 200) {
                    var tmpdata= JSON.parse(body);
                    tarFile = BASE_URL + 'yo@' +  tmpdata.version + '.map';
                   // log('basetarFile = '+ tarFile);
                    updateDate(tarFile, installPath);
                } else {
                    error(sourceConfigFile + ' 解析失败！');
                }
            });
        }

    }

}

exports.usage = "yo构建工具"

exports.set_options = function(optimist) {
    optimist.alias('p', 'publish');
    optimist.describe('p', '发布至source【开发者使用】');

    optimist.alias('i', 'install');
    optimist.describe('i', '安装Yo');

    optimist.alias('u', 'update');
    optimist.describe('u', '更新Yo');

    optimist.alias('v', 'version');
    optimist.describe('v', '查看yo构建工具版本号');

    optimist.describe('path', '指定路径,支持绝对和相对路径');

    return optimist
}


exports.run = function(options) {
    //log(options);
    var root;
    var cwd = options.cwd;
    var customPath = options.path;
    var sourcePath = BASE_URL

    if(customPath) {
        if(customPath !== true) {
            //root = customPath.charAt(0) == '/' ? cwd + customPath : path.join(cwd, customPath)
            //TODO
            root = customPath.charAt(0) == '/' ? path.join(cwd, customPath) : path.join(cwd, customPath)
            //log(root);
        }else{
            error('输入有误，请输入--help查看yo命令工具帮助');
            return;
        }
    }
    else {
        root = cwd;
    }
    //log(customPath);

    options.publish = typeof options.p == "undefined" ? options.publish : options.p;
    options.install = typeof options.i == "undefined" ? options.install : options.i;
    options.update = typeof options.u == "undefined" ? options.update : options.u;
    options.version = typeof options.v == "undefined" ? options.version : options.v;

    if(options.version) {
        showVersion();
    }
    else if(options.publish) {
        publish(root);

    }else if(options.install) {

        //var installPath = options.path !==true ? root : path.join(root,'yo');
       // log(options);
        var version = options.i || options.install;
        install(root,version);
    }else {
        var updateversion = options.u || options.update;
        update(root,updateversion);
    }

}