/**
 * @description 上传文件（pdf、视频、音频等用ifram能打开的文件）
 * @author hnxyhcz
 */

import Editor from '../../editor/index'
import { arrForEach, forEach } from '../../utils/util'
import post from '../../editor/upload/upload-core'
import Progress from '../../editor/upload/progress'

type ResType = {
    errno: number | string
    data: string[]
}

class UploadFile {
    private editor: Editor

    constructor(editor: Editor) {
        this.editor = editor
    }

    /**
     * 提示信息
     * @param alertInfo alert info
     * @param debugInfo debug info
     */
    private alert(alertInfo: string, debugInfo?: string): void {
        const customAlert = this.editor.config.customAlert
        if (customAlert) {
            customAlert(alertInfo)
        } else {
            window.alert(alertInfo)
        }

        if (debugInfo) {
            console.error('wangEditor: ' + debugInfo)
        }
    }

    /**
     * 往编辑区域插入能用iframe打开的文件
     * @param src 图片地址
     */
    public insert(src: string, type: string): void {
        const editor = this.editor
        const config = editor.config
        const {
            iframeProps: { width, height },
        } = editor.config

        const i18nPrefix = 'validate.'
        const t = (text: string, prefix: string = i18nPrefix): string => {
            return editor.i18next.t(prefix + text)
        }

        // 先插入Iframe，无论是否能成功
        const style = `max-width:100%;width:${width}`
        if (type === '音频') {
            editor.cmd.do(
                'insertHTML',
                `<p><audio src="${src}" style=${style} controls="controls" /></p>`
            )
        } else if (type === '视频') {
            editor.cmd.do(
                'insertHTML',
                `<p><video src="${src}" style=${style} controls="controls" /></p>`
            )
        } else {
            editor.cmd.do(
                'insertHTML',
                `<p><iframe src="${src}" style="${style};height:${height}" frameborder="0" /></p>`
            )
        }

        // 执行回调函数
        config.insertFileCallback(src)

        // 加载视频
        let file: any = document.createElement('file')
        file.onload = () => {
            file = null
        }
        file.onerror = () => {
            this.alert(
                t(`插入${type}错误`),
                `wangEditor: ${t(`插入${type}错误`)}，${t(`${type}链接`)} "${src}"，${t(
                    '下载链接失败'
                )}`
            )
            file = null
        }
        file.onabort = () => (file = null)
        file.src = src
    }

    /**
     * 上传视频
     * @param files 文件列表
     * @param type  上传PDF | 上传视频 | 上传音频
     */
    public upload(files: FileList | File[], type: string): void {
        if (!files.length) {
            return
        }

        const editor = this.editor
        const config = editor.config

        // ------------------------------ i18next ------------------------------

        const i18nPrefix = 'validate.'
        const t = (text: string): string => {
            return editor.i18next.t(i18nPrefix + text)
        }

        // ------------------------------ 获取配置信息 ------------------------------

        // 服务端地址
        let uploadFileServer = config.uploadFileServer
        // 视频最大体积
        const maxSize = config.uploadFileMaxSize
        const maxSizeM = maxSize / 1024 / 1024
        // 一次最多上传视频数量
        const maxLength = config.uploadFileMaxLength
        // 自定义 fileName
        const uploadFileName = config.uploadFileName
        // 自定义参数
        const uploadFileParams = config.uploadFileParams
        // 参数拼接到 url 中
        const uploadFileParamsWithUrl = config.uploadFileParamsWithUrl
        // 自定义 header
        const uploadFileHeaders = config.uploadFileHeaders
        // 钩子函数
        const hooks = config.uploadFileHooks
        // 上传图片超时时间
        const timeout = config.uploadFileTimeout

        // ------------------------------ 验证文件信息 ------------------------------
        const resultFiles: File[] = []
        const errInfos: string[] = []
        arrForEach(files, (file: File) => {
            const name = file.name
            const size = file.size

            // chrome 低版本 name === undefined
            if (!name || !size) {
                return
            }

            if (
                /\.(rm|rmvb|3gp|avi|mpeg|mpg|mkv|dat|asf|wmv|flv|mov|mp4|ogg|ogm)$/i.test(name) ===
                    false &&
                type === '视频'
            ) {
                // 后缀名不合法，不是视频文件
                errInfos.push(`【${name}】${t('不是视频文件')}`)
                return
            }

            if (/\.(pdf)$/i.test(name) === false && type === 'PDF') {
                // 后缀名不合法，不是PDF文件
                errInfos.push(`【${name}】${t('不是PDF文件')}`)
                return
            }

            if (/\.(mp3)$/i.test(name) === false && type === '音频') {
                // 后缀名不合法，不是音频文件
                errInfos.push(`【${name}】${t('不是音频文件')}`)
                return
            }

            if (maxSize < size) {
                // 上传视频过大
                errInfos.push(`【${name}】${t('大于')} ${maxSizeM}M`)
                return
            }

            // 验证通过的加入结果列表
            resultFiles.push(file)
        })
        // 抛出验证信息
        if (errInfos.length) {
            this.alert(`${t({ type } + '验证未通过')}: \n` + errInfos.join('\n'))
            return
        }
        if (resultFiles.length > maxLength) {
            this.alert(t('一次最多上传') + maxLength + t('个文件'))
            return
        }

        // ------------------------------ 上传文件 ------------------------------

        // 添加图片数据
        const formData = new FormData()
        resultFiles.forEach((file: File, index: number) => {
            let name = uploadFileName || file.name
            if (resultFiles.length > 1) {
                // 多个文件时，filename 不能重复
                name = name + (index + 1)
            }
            formData.append('file', file)
        })
        if (uploadFileServer) {
            // 添加自定义参数
            const uploadFileServerArr = uploadFileServer.split('#')
            uploadFileServer = uploadFileServerArr[0]
            const uploadFileServerHash = uploadFileServerArr[1] || ''
            forEach(uploadFileParams, (key: string, val: string) => {
                // 因使用者反应，自定义参数不能默认 encode ，由 v3.1.1 版本开始注释掉
                // val = encodeURIComponent(val)

                // 第一，将参数拼接到 url 中
                if (uploadFileParamsWithUrl) {
                    if (uploadFileServer.indexOf('?') > 0) {
                        uploadFileServer += '&'
                    } else {
                        uploadFileServer += '?'
                    }
                    uploadFileServer = uploadFileServer + key + '=' + val
                }

                // 第二，将参数添加到 formData 中
                formData.append(key, val)
            })
            if (uploadFileServerHash) {
                uploadFileServer += '#' + uploadFileServerHash
            }
            // 开始上传
            const xhr = post(uploadFileServer, {
                timeout,
                formData,
                headers: uploadFileHeaders,
                beforeSend: (xhr: XMLHttpRequest) => {
                    if (hooks.before) {
                        return hooks.before(xhr, editor, resultFiles)
                    }
                },
                onTimeout: (xhr: XMLHttpRequest) => {
                    this.alert(t('上传文件超时'))
                    if (hooks.timeout) hooks.timeout(xhr, editor)
                },
                onProgress: (percent: number, e: ProgressEvent) => {
                    const progressBar = new Progress(editor)
                    if (e.lengthComputable) {
                        percent = e.loaded / e.total
                        progressBar.show(percent)
                    }
                },
                onError: (xhr: XMLHttpRequest) => {
                    this.alert(
                        t('上传文件错误'),
                        `${t('上传文件错误')}，${t('服务器返回状态')}: ${xhr.status}`
                    )
                    if (hooks.error) hooks.error(xhr, editor)
                },
                onFail: (xhr: XMLHttpRequest, resultStr: string) => {
                    this.alert(
                        t('上传文件失败'),
                        t('上传文件返回结果错误') + `，${t('返回结果')}: ` + resultStr
                    )
                    if (hooks.fail) hooks.fail(xhr, editor, resultStr)
                },
                onSuccess: (xhr: XMLHttpRequest, result: ResType) => {
                    if (hooks.customInsert) {
                        // 自定义插入文件
                        hooks.customInsert(this.insert.bind(this), result, editor)
                        return
                    }
                    if (result.errno != '0') {
                        // 返回格式不对，应该为 { errno: 0, data: [...] }
                        this.alert(
                            t('上传文件失败'),
                            `${t('上传文件返回结果错误')}，${t('返回结果')} errno=${result.errno}`
                        )
                        if (hooks.fail) hooks.fail(xhr, editor, result)
                        return
                    }
                    // 成功，插入文件
                    const data = result.data
                    data.forEach(link => {
                        this.insert(link, type)
                    })

                    // 钩子函数
                    if (hooks.success) hooks.success(xhr, editor, result)
                },
            })
            if (typeof xhr === 'string') {
                // 上传被阻止
                this.alert(xhr)
            }

            // 阻止以下代码执行，重要！！！
            return
        }
    }
}

export default UploadFile
