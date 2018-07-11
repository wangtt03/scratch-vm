const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Runtime = require('../../engine/runtime');
const Video = require('../../io/video');
import Sounds from './Sounds'

const TextToAudioState = {
    Female: '女性',
    Male: '男性',
};

class Scratch3StemBlocks {
    constructor (runtime) {
        this.runtime = runtime;
    }
    getInfo () {
        return {
            id: 'stem',
            name: '人工智能',
            blocks: [
                {
                    opcode: 'stemOpenVideo',
                    blockType: BlockType.COMMAND,
                    text: '打开摄像头',
                },
                {
                    opcode: 'stemCloseVideo',
                    blockType: BlockType.COMMAND,
                    text: '关闭摄像头',
                },
                {
                    opcode: 'stemSpeaker',
                    blockType: BlockType.COMMAND,
                    text: '使用 [AUDIO_GENDER] 语音合成 [TEXT]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: '你好世界！'
                        },
                        AUDIO_GENDER: {
                            type: ArgumentType.NUMBER,
                            menu: 'AUDIO_GENDER',
                            defaultValue: TextToAudioState.Female
                        }
                    }
                },
                {
                    opcode: 'imageRecognizer',
                    blockType: BlockType.REPORTER,
                    text: '使用模型 [TEXT] 识别图像',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: '00000'
                        }
                    }
                },
                {
                    opcode: 'emotionRecognizer',
                    blockType: BlockType.REPORTER,
                    text: '检测人脸表情',
                },
                {
                    opcode: 'imageGeneralRecognizer',
                    blockType: BlockType.REPORTER,
                    text: '识别图像',
                },
                {
                    opcode: 'textGeneralRecognizer',
                    blockType: BlockType.REPORTER,
                    text: '识别图像中的文字',
                }
            ],
            menus: {
                AUDIO_GENDER: this._buildMenu(this.AUDIO_GENDER_INFO)
            }

        };
    }

    get AUDIO_GENDER_INFO () {
        return [
            {
                name: "男性",
                value: TextToAudioState.Male
            },
            {
                name: "女性",
                value: TextToAudioState.Female
            }
        ];
    }

    _buildMenu (info) {
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = entry.value || String(index + 1);
            return obj;
        });
    }

    stemCloseVideo() {
        this.runtime.ioDevices.video.disableVideo();        
    }
    stemOpenVideo(){
        this.runtime.ioDevices.video.enableVideo();
    }
    
    stemSpeaker (args) {
        var gender = args.AUDIO_GENDER;
        if (gender == TextToAudioState.Male) {
            gender = 1;
        } else {
            gender = 0;
        }
        let xhr = new XMLHttpRequest();
        xhr.open('GET', '/speech/baidutoken', false);
        xhr.send();
        if (xhr.status === 200) {
            let res = JSON.parse(xhr.responseText);
            Sounds.getSingleton().playURL("https://tsn.baidu.com/text2audio?tex="+args.TEXT+"&tok="+res["access_token"]+"&spd=5&pit=5&vol=15&per="+gender+"&cuid=24.8e3b7a22de8dad3b796edd9a56463eca.2592000.1530540031.282335-11340832&ctp=1&lan=zh&atype=.mp3");
        }

    }
    imageRecognizer (args) {
        const canvas = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_CANVAS,
            dimensions: [480, 360]
        }); 
        
        if (!canvas) {
            return "error";
        }

        let dataurl = canvas.toDataURL('image/png');
        let arr = dataurl.split(','), 
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), 
            n = bstr.length, 
            u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        let blob = new Blob([u8arr], {type:mime});
        console.log(URL.createObjectURL(blob));

        let postData = new FormData();
        postData.append('fileData', blob);
        postData.append('baseModel', "mobilenet_0.50_224_image_classification");
        postData.append('versionID', args.TEXT);
        postData.append('versionName', '动物分类');

        let xhr = new XMLHttpRequest();
        xhr.open('POST', '/stemgarden/stemgarden/1.0/ai/tensorflow/predictFromFile', false);
        xhr.send(postData);
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            let res = JSON.parse(xhr.responseText);
            res = res.sort(function(a,b){
                if (a.score > b.score) return -1;
                return 1;
            });
            return res[0].class;
        }
        console.log('error');
        return "error";
    }

    textGeneralRecognizer() {
        const canvas = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_CANVAS,
            dimensions: [480, 360]
        }); 

        if (!canvas) {
            return "error";
        }
        let dataurl = canvas.toDataURL('image/jpeg',0.7);
        let arr = dataurl.split(',');

        let xhr = new XMLHttpRequest();
        xhr.open('GET', '/speech/baidutexttoken', false);
        xhr.send();
        if (xhr.status === 200) {
            let res = JSON.parse(xhr.responseText);
            let xhr2 = new XMLHttpRequest();
            xhr2.open('POST', 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=' + res["access_token"], false);
            xhr2.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
            xhr2.send("image=" + encodeURIComponent(arr[1]));
            if (xhr2.status === 200) {
                let res2 = JSON.parse(xhr2.responseText);
                if (!!res2.words_result && res2.words_result.length > 0) {
                    return res2.words_result[0].words;
                }
            }
        }
        return "error";
    }

    imageGeneralRecognizer() {
        const canvas = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_CANVAS,
            dimensions: [480, 360]
        }); 

        if (!canvas) {
            return "error";
        }
        let dataurl = canvas.toDataURL('image/jpeg',0.7);
        let arr = dataurl.split(',');

        let xhr = new XMLHttpRequest();
        xhr.open('GET', '/speech/baiducetoken', false);
        xhr.send();
        if (xhr.status === 200) {
            let res = JSON.parse(xhr.responseText);
            let xhr2 = new XMLHttpRequest();
            xhr2.open('POST', 'https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=' + res["access_token"], false);
            xhr2.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
            xhr2.send("image=" + encodeURIComponent(arr[1]));
            if (xhr2.status === 200) {
                let res2 = JSON.parse(xhr2.responseText);
                if (!!res2.result && res2.result.length > 0) {
                    return res2.result[0].keyword;
                }
            }
        }
        return "error";
    }

    emotionRecognizer() {
        const canvas = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_CANVAS,
            dimensions: [480, 360]
        }); 
        if (!canvas) {
            return "error";
        }
        let dataurl = canvas.toDataURL('image/png');
        let arr = dataurl.split(','), 
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), 
            n = bstr.length, 
            u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        let blob = new Blob([u8arr], {type:mime});
        console.log(URL.createObjectURL(blob));

        let postData = new FormData();
        postData.append('data', blob);

        let xhr = new XMLHttpRequest();
        xhr.open('POST', '/stemgarden/stemgarden/1.0/faceAPI/emotionDetect', false);
        xhr.send(postData);
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            return xhr.responseText;
        }
        return "error";
    }
};

module.exports = Scratch3StemBlocks;