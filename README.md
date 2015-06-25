YoBuilder
=============================
依赖于fekit，当前版本已支持yo的多版本管理

## 安装
执行npm install fekit-extension-yo

## 使用流程
1. 在需要使用Yo库的目录下执行fekit yo --install命令,将在该下安装所有yo文件
2. 可指定安装版本 fekit yo --install '1.0.1'
3. 使用--path可以自定义安装路径

## 命令介绍
安装完YoBuilder后可以执行fekit yo --help查看命令使用帮助

### --install || -i
说明：当前目录下安装最新版yo文件

例如：fekit yo -i

### --install [版本号] || -i [版本号]
参数：版本号 格式 1.0.1

说明：当前目录下安装指定版本yo文件

例如：fekit yo -i '1.0.0'

### --update [版本号] || -u [版本号]
参数：版本号 格式 1.0.1

说明：更新当前目录下yo/lib文件

例如：fekit yo -u '1.0.0'

### --publish || -p
说明：发布，仅供开发者使用！默认打包到当前目录下的yo-source文件夹。必须保证组件当前配置的version(/yo/lib/core/variables.scss中的version)大于yo-source/yo.config中配置的版本，否则**发布失败**。发布成功后会自动更新kami-source中的版本号。

例如：fekit yo -p

### --version || -v
说明：查看Yo历史版本号。

例如：fekit yo -v


### --yoversion || --ver
说明：查看Yo构建工具版本号。

例如：fekit yo --ver

### --path
说明：自定义路径，支持绝对路径和相对路径。对install命令都有效。

例如：fekit yo --install --path '/Users/guest/yo'    fekit yo --install --path '../guest/yo'
     fekit yo -i 1.0.4 --path test01
     fekit yo -i 1.0.4 --path ./test01



## TODO
1）提供单独的Yo命令工具，不依赖于fekit，需要考虑如何解决require问题

