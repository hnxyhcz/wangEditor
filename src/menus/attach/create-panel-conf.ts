/**
 * @description video 菜单 panel tab 配置
 * @author tonghan
 */

import editor from '../../editor/index'
import { PanelConf, PanelTabConf } from '../menu-constructors/Panel'
import { getRandom } from '../../utils/util'
import $ from '../../utils/dom-core'
import UploadFile from './upload-file'

export default function (editor: editor, video: string): PanelConf {
    const config = editor.config
    const uploadFile = new UploadFile(editor)

    /**
     * 生成TabConfig
     */
    const generateTabConfig = (title: string, accept: string): PanelTabConf => {
        // panel 中需要用到的id
        const upFileTriggerId = getRandom('up-file-trigger')
        const upFileId = getRandom('up-file')

        return {
            // 标题
            title: editor.i18next.t(`menus.panelMenus.attach.上传${title}`),
            // 模板
            tpl: `
                <div class="w-e-up-img-container">
                    <div id="${upFileTriggerId}" class="w-e-up-btn">
                        <i class="w-e-icon-upload2"></i>
                    </div>
                    <div style="display:none;">
                        <input id="${upFileId}" type="file" multiple="multiple" accept="${accept}"/>
                    </div>
                </div>
            `,
            // 事件绑定
            events: [
                // 触发选择文件
                {
                    selector: '#' + upFileTriggerId,
                    type: 'click',
                    fn: () => {
                        const $file = $('#' + upFileId)
                        const fileElem = $file.elems[0]
                        if (fileElem) {
                            fileElem.click()
                        } else {
                            // 返回 true 可关闭 panel
                            return true
                        }
                    },
                },
                // 选择文件完毕
                {
                    selector: '#' + upFileId,
                    type: 'change',
                    fn: () => {
                        const $file = $('#' + upFileId)
                        const fileElem = $file.elems[0]
                        if (!fileElem) {
                            // 返回 true 可关闭 panel
                            return true
                        }

                        // 获取选中的 file 对象列表
                        const fileList = (fileElem as any).files
                        if (fileList.length) {
                            uploadFile.upload(fileList, title)
                        }

                        // 返回 true 可关闭 panel
                        return true
                    },
                },
            ],
        }
    }

    const conf: PanelConf = {
        width: 300,
        height: 0,
        tabs: [],
    }

    if (window.FileReader && config.uploadFileServer) {
        // 显示“上传PDF”
        if (config.showUploadPDF) {
            conf.tabs.push(generateTabConfig('PDF', 'application/pdf'))
        }
        if (config.showUploadVideo) {
            conf.tabs.push(generateTabConfig('视频', 'video/*'))
        }
        if (config.showUploadAudio) {
            conf.tabs.push(generateTabConfig('音频', 'audio/*'))
        }
    }

    return conf
}
