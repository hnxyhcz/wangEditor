/**
 * @description 上传文件相关的配置
 * @author hnxyhcz
 */

import { EMPTY_FN } from '../utils/const'

export type UploadFileHooksType = {
    before?: Function
    success?: Function
    fail?: Function
    error?: Function
    timeout?: Function
    customInsert?: Function
}

export default {
    // 插入文件成功之后的回调函数
    insertFileCallback: EMPTY_FN,

    // 服务端地址
    uploadFileServer: '',

    // 显示上传pdf
    showUploadPDF: true,

    // 显示上传视频
    showUploadVideo: true,

    // 显示上传音频
    showUploadAudio: true,

    // 上传文件的最大体积，默认 256M
    uploadVideoMaxSize: 256 * 1024 * 1024,

    // 一次最多上传多少个文件, 默认5个
    uploadFileMaxLength: 5,

    // 自定义上传文件的名称
    uploadFileName: '',

    // 上传文件自定义参数
    uploadFileParams: {},

    // 自定义参数拼接到 url 中
    uploadFileParamsWithUrl: false,

    // 上传文件自定义 header
    uploadFileHeaders: {},

    // 钩子函数
    uploadFileHooks: {},

    // 上传文件超时时间 ms, 默认30min
    uploadFileTimeout: 30 * 60 * 1000,

    // iframe, video 宽高， 默认宽度400
    iframeProps: {
        width: '400px',
        height: '366px',
    },
}
