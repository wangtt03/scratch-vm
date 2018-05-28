const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Runtime = require('../../engine/runtime');
const Video = require('../../io/video');
import Sounds from './Sounds'

class Scratch3StemBlocks {
    constructor (runtime) {
        this.runtime = runtime;
    }
    getInfo () {
        this.runtime.ioDevices.video.enableVideo();
        return {
            id: 'stem',
            name: '人工智能',
            blocks: [
                {
                    opcode: 'stemSpeaker',
                    blockType: BlockType.COMMAND,
                    text: '说 [TEXT]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: '你好世界！'
                        }
                    }
                },
                {
                    opcode: 'imageRecognizer',
                    blockType: BlockType.REPORTER,
                    text: '识别小动物图像'
                }
            ]
        };
    }
    stemSpeaker (args) {
        Sounds.getSingleton().playURL("/speech/tts/"+args.TEXT+"/demo.wav");
    }
    imageRecognizer () {/*
        const frame = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_IMAGE_DATA,
            dimensions: [100, 100]
        });
        
        let canvas = document.createElement('canvas');
        let ctx =canvas.getContext('2d');
        let imageData = ctx.createImageData(100, 100);
        for (let i = 0; i < frame.data.length; ++i) {
            imageData.data[i] = frame.data[i];
        }
        ctx.putImageData(imageData, 0, 0);*/


        const canvas = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_CANVAS,
            dimensions: [480, 360]
        }); 

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
        postData.append('versionID', '28952');
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
}

module.exports = Scratch3StemBlocks;