const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Runtime = require('../../engine/runtime');
const Video = require('../../io/video');
import Sounds from './Sounds'

const TextToAudioState = {
    Female: '女性',
    Male: '男性',
};

const TextOrientationState = {
    Normal: '正常',
    Mirror: '镜像',
};

const SrLangTypeState = {
    Putonghua: '普通话',
    English: '英语',
    Yue:"粤语",
    Sichuan:"四川话"
};

let assetData = {};
try {
    assetData = require('./manifest');
} catch (e) {
    // Non-webpack environment, don't worry about assets.
}
class Scratch3StemBlocks {
    constructor (runtime) {
        this.runtime = runtime;

        this.dataBuffer = [];

        this._speechPromises = [];
        this._currentUtterance = '';
        this._currentEmotion = '';
        this._currentModelPredict = '';
        this._currentOcrResult = '';
        this._currentGeneralImagePredict = '';

        this._processAudioCallback = this._processAudioCallback.bind(this);
        this._resetListening = this._resetListening.bind(this);
        this._stopTranscription = this._stopTranscription.bind(this);

        this._loadUISounds();
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
                    blockType: BlockType.COMMAND,
                    text: '使用模型 [TEXT] 识别图像',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: '00000'
                        }
                    }
                },
                {
                    opcode: 'getImageRecognizer',
                    text: '获取模型识别结果',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'emotionRecognizer',
                    blockType: BlockType.COMMAND,
                    text: '检测人脸表情',
                },
                {
                    opcode: 'getEmotion',
                    text: '获取人脸表情识别结果',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'imageGeneralRecognizer',
                    blockType: BlockType.COMMAND,
                    text: '使用通用模型识别图像',
                },
                {
                    opcode: 'getImageGeneralRecognizer',
                    text: '获取通用模型图像识别结果',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'textGeneralRecognizer',
                    blockType: BlockType.COMMAND,
                    text: '识别图像中的文字 [TEXT_ORI]',
                    arguments: {
                        TEXT_ORI: {
                            type: ArgumentType.NUMBER,
                            menu: 'TEXT_ORI',
                            defaultValue: TextOrientationState.Normal
                        }
                    }
                },
                {
                    opcode: 'getTextGeneralRecognizer',
                    text: '获取图像文字识别结果',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'listenAndWait',
                    text: '开始语音识别 [LANG_TYPE] 持续 [SR_DURATION]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        SR_DURATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        },
                        LANG_TYPE: {
                            type: ArgumentType.NUMBER,
                            menu: 'LANG_TYPE',
                            defaultValue: SrLangTypeState.Putonghua
                        }
                    }
                },
                {
                    opcode: 'getSpeech',
                    text: '获取语音识别结果',
                    blockType: BlockType.REPORTER
                }
            ],
            menus: {
                AUDIO_GENDER: this._buildMenu(this.AUDIO_GENDER_INFO),
                TEXT_ORI: this._buildMenu(this.TEXT_ORI_INFO),
                LANG_TYPE: this._buildMenu(this.LANG_TYPE_INFO)
            }

        };
    }

    get LANG_TYPE_INFO () {
        return [
            {
                name: "普通话",
                value: SrLangTypeState.Putonghua
            },
            {
                name: "英语",
                value: SrLangTypeState.English
            },
            {
                name: "粤语",
                value: SrLangTypeState.Yue
            },
            {
                name: "四川话",
                value: SrLangTypeState.Sichuan
            }
        ];
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

    get TEXT_ORI_INFO () {
        return [
            {
                name: "正常",
                value: TextOrientationState.Normal
            },
            {
                name: "镜像",
                value: TextOrientationState.Mirror
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

    getSpeech () {
        return this._currentUtterance;
    }

    getEmotion () {
        return this._currentEmotion;
    }

    listenAndWait (args) {
        this.srDuration = args.SR_DURATION;
        if (this.srDuration > 10) {
            this.srDuration = 10;
        }
        this.langCode = 1537;
        if (args.LANG_TYPE == SrLangTypeState.English) {
            this.langCode = 1737;
        } else if (args.LANG_TYPE == SrLangTypeState.Yue) {
            this.langCode = 1637;
        } else if (args.LANG_TYPE == SrLangTypeState.Sichuan) {
            this.langCode = 1837;
        }

        // this._phraseList = this._scanBlocksForPhraseList();
        // this._utteranceForEdgeTrigger = '';
        return this._playSound(this._startSoundBuffer).then(() => {
                const speechPromise = new Promise(resolve => {
                    const listeningInProgress = this._speechPromises.length > 0;
                    this._speechPromises.push(resolve);
                    if (!listeningInProgress) {
                        this._startListening();
                    }
                });
                return speechPromise.then(() => {});
            });
    }

    _loadUISounds () {
        const startSoundBuffer = assetData['speech-rec-start.mp3'];
        this._decodeSound(startSoundBuffer).then(buffer => {
            this._startSoundBuffer = buffer;
        });

        const endSoundBuffer = assetData['speech-rec-end.mp3'];
        this._decodeSound(endSoundBuffer).then(buffer => {
            this._endSoundBuffer = buffer;
        });
    }

    _decodeSound (soundBuffer) {
        const context = this.runtime.audioEngine && this.runtime.audioEngine.audioContext;

        if (!context) {
            return Promise.reject(new Error('No Audio Context Detected'));
        }

        // Check for newer promise-based API
        if (context.decodeAudioData.length === 1) {
            return context.decodeAudioData(soundBuffer);
        } else { // eslint-disable-line no-else-return
            // Fall back to callback API
            return new Promise((resolve, reject) =>
                context.decodeAudioData(soundBuffer,
                    buffer => resolve(buffer),
                    error => reject(error)
                )
            );
        }
    }

    _playSound (buffer) {
        if (this.runtime.audioEngine === null) return;
        const context = this.runtime.audioEngine.audioContext;
        const bufferSource = context.createBufferSource();
        bufferSource.buffer = buffer;
        bufferSource.connect(this.runtime.audioEngine.audioContext.destination);
        bufferSource.start();
        return new Promise(resolve => {
            bufferSource.onended = () => {
                resolve();
            };
        });
    }

    _resolveSpeechPromises () {
        for (let i = 0; i < this._speechPromises.length; i++) {
            const resFn = this._speechPromises[i];
            resFn();
        }
        this._speechPromises = [];
    }

    _startListening () {
        // If we've already setup the context, we can resume instead of doing all the setup again.
        if (this._context) {
            this._resumeListening();
        } else {
            this._initListening();
        }
        // Force the block to timeout if we don't get any results back/the user didn't say anything.
        this._speechTimeoutId = setTimeout(this._stopTranscription, this.srDuration * 1000);
    }

    _initListening () {
        this._initializeMicrophone();
        this._initScriptNode();

        Promise.all([this._audioPromise]).then((values)=>{
            this._micStream = values[0];
            this._startByteStream();
        }).catch(e => {
            log.error(`Problem with setup:  ${e}`);
        });
    }

    _startByteStream () {
        // Hook up the scriptNode to the mic
        this._sourceNode = this._context.createMediaStreamSource(this._micStream);
        this._sourceNode.connect(this._scriptNode);
        this._scriptNode.addEventListener('audioprocess', this._processAudioCallback);
        this._scriptNode.connect(this._context.destination);
    }

    _processAudioCallback (e) {
        const floatSamples = Float32Array.from(e.inputBuffer.getChannelData(0));
        this.dataBuffer.push(this._interpolateArray(floatSamples, 8000, 44100));
    }

    _interpolateArray(data, newSampleRate, oldSampleRate) {
        var fitCount = Math.round(data.length * (newSampleRate / oldSampleRate));
        //var newData = new Array();
        var newData = [];
        //var springFactor = new Number((data.length - 1) / (fitCount - 1));
        var springFactor = Number((data.length - 1) / (fitCount - 1));
        newData[0] = data[0]; // for new allocation
        for (var i = 1; i < fitCount - 1; i++) {
            var tmp = i * springFactor;
            //var before = new Number(Math.floor(tmp)).toFixed();
            //var after = new Number(Math.ceil(tmp)).toFixed();
            var before = Number(Math.floor(tmp)).toFixed();
            var after = Number(Math.ceil(tmp)).toFixed();
            var atPoint = tmp - before;
            newData[i] = this._linearInterpolate(data[before], data[after], atPoint);
        }
        newData[fitCount - 1] = data[data.length - 1]; // for new allocation
        return newData;
    }

    _linearInterpolate(before, after, atPoint) {
        return before + (after - before) * atPoint;
    }

    _initScriptNode () {
        // Create a node that sends raw bytes across the websocket
        this._scriptNode = this._context.createScriptProcessor(4096, 1, 1);
    }

    _initializeMicrophone () {
        // Safari still needs a webkit prefix for audio context
        this._context = new (window.AudioContext || window.webkitAudioContext)();
        this._audioPromise = navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                channelCount: 1,
                sampleRate: {
                    ideal: 44100
                },
                sampleSize: 16
            }
        });

        this._audioPromise.then(() => {
        }).catch(e => {
            log.error(`Problem connecting to microphone:  ${e}`);
        });
    }

    _resumeListening () {
        this._clearAudioBuffer();
        this._context.resume.bind(this._context);
        Promise.all([this._audioPromise]).then((values)=>{
            this._micStream = values[0];
            this._startByteStream();
        }).catch(e => {
            console.log(`Problem with setup:  ${e}`);
        });
    }

    _clearAudioBuffer() {
        this.dataBuffer = [];
    }

    _resetListening () {
        this._stopListening();
        // this._closeWebsocket();
        this._resolveSpeechPromises();
        this._clearAudioBuffer();
    }

    _stopTranscription () {
        this._stopListening();

        var len = 0;
        for (var i = 0; i < this.dataBuffer.length; i++){
            len += this.dataBuffer[i].length;
        }
        var interleaved = new Float32Array(len);
        var offset = 0;
        for (var i = 0; i < this.dataBuffer.length; i++){
            interleaved.set(this.dataBuffer[i], offset);
            offset += this.dataBuffer[i].length;
        }

        var output = new Int16Array(interleaved.length);
        for (var i = 0; i < interleaved.length; i++){
            var s = Math.max(-1, Math.min(1, interleaved[i]));
            output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
        }
        
        const uploadPromise = new Promise(rev => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        let res = JSON.parse(xhr.responseText);
                        if (!!res.result && res.result.length > 0) {
                            this._currentUtterance = res.result[0];
                            rev(this._currentUtterance);
                        }
                    } else {
                        rev("");
                    }
                }
            };
            xhr.open('POST', '/speech/sr/' + this.langCode, true);
            xhr.setRequestHeader("Content-Type", "audio/pcm;rate=8000")
            xhr.send(output);
            this._speechFinalResponseTimeout = setTimeout(this._resetListening, 3000);
        });

        uploadPromise.then((result)=>{
            this._currentUtterance = result;
        });
    }

    _stopListening () {
        // Note that this can be called before any Listen And Wait block did setup,
        // so check that things exist before disconnecting them.
        if (this._context) {
            this._context.suspend.bind(this._context);
        }
        // This is called on green flag to reset things that may never have existed
        // in the first place. Do a bunch of checks.
        if (this._scriptNode) {
            this._scriptNode.removeEventListener('audioprocess', this._processAudioCallback);
            this._scriptNode.disconnect();
        }
        if (this._sourceNode) {
            this._sourceNode.disconnect();
        }

    }
    
    stemSpeaker (args) {
        var gender = args.AUDIO_GENDER;
        if (gender == TextToAudioState.Male) {
            gender = 1;
        } else {
            gender = 0;
        }

        return new Promise(resolve => {
            resolve();
        }).then(() => {
            const playSoundPromise = new Promise(rev => {
                let xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            let res = JSON.parse(xhr.responseText);
                            Sounds.getSingleton().playURL("https://tsn.baidu.com/text2audio?tex="+args.TEXT+"&tok="+res["access_token"]+"&spd=5&pit=5&vol=15&per="+gender+"&cuid=24.8e3b7a22de8dad3b796edd9a56463eca.2592000.1530540031.282335-11340832&ctp=1&lan=zh&atype=.mp3", {onEnded: function(){
                                rev();
                            }});
                        } else {
                            rev();
                        }
                    }
                };
                xhr.open('GET', '/speech/baidutoken', true);
                xhr.send();
            });

            return playSoundPromise.then(()=>{});
        });

    }

    imageRecognizer (args) {
        const canvas = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_CANVAS,
            dimensions: [480, 360]
        }); 
        
        if (!canvas) {
            this._currentModelPredict = "error";
            return;
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

        const modelPromise = new Promise(rev => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        let res = JSON.parse(xhr.responseText);
                        res = res.sort(function(a,b){
                            if (a.score > b.score) return -1;
                            return 1;
                        });
                        rev(res[0].class);
                    } else {
                        rev("error");
                    }
                }
            };
            xhr.open('POST', '/stemgarden/stemgarden/1.0/ai/tensorflow/predictFromFile', true);
            xhr.send(postData);
        });

        return modelPromise.then(res => {
            this._currentModelPredict = res;
        });
    }

    getImageRecognizer() {
        return this._currentModelPredict;
    }

    getTextGeneralRecognizer() {
        return this._currentOcrResult;
    }

    textGeneralRecognizer(args) {
        var mirrorInfo = true;
        if (args.TEXT_ORI == TextOrientationState.Normal) {
            mirrorInfo = false;
        }
        const canvas = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_CANVAS,
            dimensions: [480, 360],
            mirror: mirrorInfo,
        }); 

        if (!canvas) {
            this._currentOcrResult = "error";
            return;
        }
        let dataurl = canvas.toDataURL('image/jpeg',0.7);
        let arr = dataurl.split(',');

        const ocrPromise = new Promise(rev => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        let res = JSON.parse(xhr.responseText);
                        if (!!res.words_result && res.words_result.length > 0) {
                            // var words = [];
                            // for (let index = 0; index < res.words_result.length; index++) {
                            //     const element = res.words_result[index];
                            //     words.push(element.words);
                            // }
                            // return words;
                            rev(res.words_result[0].words);
                        }
                    } else {
                        rev("");
                    }
                }
            };
            xhr.open('POST', '/speech/ocr', true);
            xhr.send(encodeURIComponent(arr[1]));
        });

        return ocrPromise.then(result => {
            this._currentOcrResult = result;
        });
    }

    getImageGeneralRecognizer() {
        return this._currentGeneralImagePredict;
    }

    imageGeneralRecognizer() {
        const canvas = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_CANVAS,
            dimensions: [480, 360]
        }); 

        if (!canvas) {
            this._currentGeneralImagePredict = "error";
            return;
        }

        let dataurl = canvas.toDataURL('image/jpeg',0.7);
        let arr = dataurl.split(',');

        const generalPromise = new Promise(rev => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        let res = JSON.parse(xhr.responseText);
                        rev(res["access_token"]);
                    } else {
                        rev("");
                    }
                }
            };
            xhr.open('GET', '/speech/baiducetoken', true);
            xhr.send();
        });

        return generalPromise.then((token) => {
            return new Promise(recv => {
                let xhr2 = new XMLHttpRequest();
                xhr2.onreadystatechange = function () {
                    if (xhr2.readyState == 4) {
                        if (xhr2.status == 200) {
                            let res2 = JSON.parse(xhr2.responseText);
                            if (!!res2.result && res2.result.length > 0) {
                                recv(res2.result[0].keyword);
                            }
                        } else {
                            recv("");
                        }
                    }
                };
                
                xhr2.open('POST', 'https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=' + token, true);
                xhr2.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
                xhr2.send("image=" + encodeURIComponent(arr[1]));
            }).then(result => {
                this._currentGeneralImagePredict = result;
            });
        });
    }

    emotionRecognizer() {
        var that = this;
        const canvas = this.runtime.ioDevices.video.getFrame({
            format: Video.FORMAT_CANVAS,
            dimensions: [480, 360]
        }); 
        if (!canvas) {
            this._currentEmotion = 'error';
            return;
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

        const emotionPromise = new Promise(rev => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        let res = JSON.parse(xhr.responseText);
                        if (!!res.faces && res.faces.length > 0) {
                            var face = res.faces[0];
                            if (!!face.attributes && !!face.attributes.emotion) {
                                var maxScore = 0;
                                var currentEmotion = "";
                                for (var emotionItem in face.attributes.emotion) {
                                    if (face.attributes.emotion[emotionItem] > maxScore) {
                                        currentEmotion = emotionItem;
                                        maxScore = face.attributes.emotion[emotionItem];
                                    }
                                    
                                }
                                rev(currentEmotion);
                            }
                        }
                    } else {
                        rev("error");
                    }
                }
            };
            xhr.open('POST', '/stemgarden/stemgarden/1.0/faceAPI/emotionDetect', true);
            xhr.send(postData);
        });

        return emotionPromise.then((res) => {
            that._currentEmotion = res;
        });
    }
};

module.exports = Scratch3StemBlocks;